"""
This is a FastAPI server that allows users to add nodes to a Merkle tree. Once the Merkle tree is populated with 8 elements, the Merkle root hash is backed up on-chain. The server is also capable of providing inclusion proofs for the stored hashes.

Key functionalities:
1. Create and manage an Ethereum wallet.
2. Store and retrieve hashes.
3. Construct a Merkle tree from stored hashes.
4. Publish the Merkle root hash on multiple blockchain networks.
5. Provide Merkle proof for a given hash.
"""

import os
import json
from eth_account import Account
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, validator
import merkletools
from web3 import Web3

# File paths for storing wallet, hashes, and Merkle tree data
WALLET_FILE = 'wallet.json'
HASHES_FILE = 'hashes.json'
MERKLE_FILE = 'merkle.json'

# Configure URLs for different testnets (using public RPC URLs)
NETWORKS = {
    'polygon': 'https://rpc-mumbai.maticvigil.com',
    'base': 'https://base-goerli.blockpi.network/v1/rpc/public',
    'ethereum': 'https://rpc.ankr.com/eth_goerli',  # Free Ethereum Goerli Testnet RPC
    'arbitrum': 'https://goerli-rollup.arbitrum.io/rpc'
}

# Initialize FastAPI app and MerkleTools instance
app = FastAPI()
mt = merkletools.MerkleTools(hash_type="sha256")

class HashData(BaseModel):
    hash: str
    block_number: int

    @validator('hash')
    def validate_hash(cls, v):
        """Validate that the hash is a 32-byte hex string."""
        if len(v) != 64:
            raise ValueError("Hash must be a 32-byte hex string")
        try:
            bytes.fromhex(v)
        except ValueError:
            raise ValueError("Hash must be a valid hex string")
        return v

def create_wallet():
    """Create a new Ethereum account and return the wallet data."""
    account = Account.create()
    wallet_data = {
        'address': account.address,
        'private_key': account.key.hex()
    }
    return wallet_data

def save_wallet(wallet_data, filename):
    """Save wallet data to a file."""
    with open(filename, 'w') as f:
        json.dump(wallet_data, f)

def load_wallet(filename):
    """Load wallet data from a file."""
    with open(filename, 'r') as f:
        wallet_data = json.load(f)
    return wallet_data

def save_hashes(hashes_data, filename):
    """Save hashes data to a file."""
    with open(filename, 'w') as f:
        json.dump(hashes_data, f)

def load_hashes(filename):
    """Load hashes data from a file, or return an empty dictionary if the file does not exist."""
    if os.path.exists(filename):
        with open(filename, 'r') as f:
            return json.load(f)
    return {}

def save_merkle_tree(merkle_data, filename):
    """Save Merkle tree data to a file."""
    with open(filename, 'w') as f:
        json.dump(merkle_data, f)

def load_merkle_tree(filename):
    """Load Merkle tree data from a file, or return an empty dictionary if the file does not exist."""
    if os.path.exists(filename):
        with open(filename, 'r') as f:
            return json.load(f)
    return {}

@app.on_event("startup")
def startup_event():
    """Event handler for FastAPI startup event. Creates a new wallet if the wallet file does not exist."""
    if not os.path.exists(WALLET_FILE):
        print("Wallet file does not exist. Creating a new wallet...")
        wallet = create_wallet()
        save_wallet(wallet, WALLET_FILE)
    else:
        print("Wallet file exists. Loading wallet...")

@app.post("/store_hash/")
def store_hash(hash_data: HashData):
    """Endpoint to store a hash. Constructs the Merkle tree if 8 hashes are stored."""
    hashes = load_hashes(HASHES_FILE)
    
    if len(hashes) >= 8:
        raise HTTPException(status_code=400, detail="Maximum 8 hashes are allowed at a time.")

    hashes[hash_data.hash] = hash_data.block_number
    save_hashes(hashes, HASHES_FILE)

    if len(hashes) == 8:
        construct_merkle_tree(hashes)
    
    return {"message": "Hash stored successfully"}

def construct_merkle_tree(hashes):
    """Construct the Merkle tree from stored hashes and publish the root hash on-chain."""
    hash_list = [k for k in hashes.keys()]
    for h in hash_list:
        mt.add_leaf(h, do_hash=False)
    mt.make_tree()

    root_hash = mt.get_merkle_root()
    merkle_data = {}
    for i, h in enumerate(hash_list):
        proof = mt.get_proof(i)
        merkle_data[h] = {
            "block_number": hashes[h],
            "proof": proof,
            "index": i
        }

    block_hashes = publish_root_hash_on_chain(root_hash)
    merkle_data["root"] = root_hash
    merkle_data["block_hashes"] = block_hashes
    save_merkle_tree(merkle_data, MERKLE_FILE)
    os.remove(HASHES_FILE)  # Clear the current hashes file for the next set

def publish_root_hash_on_chain(root_hash):
    """Publish the Merkle root hash on multiple blockchain networks and return the block hashes."""
    wallet = load_wallet(WALLET_FILE)
    address = wallet['address']
    private_key = wallet['private_key']

    block_hashes = {}

    for network, rpc_url in NETWORKS.items():
        web3 = Web3(Web3.HTTPProvider(rpc_url))
        nonce = web3.eth.get_transaction_count(address)
        gas_price = web3.eth.gas_price
        txn = {
            'nonce': nonce,
            'to': '',
            'value': 0,
            'gas': 2000000,
            'gasPrice': gas_price,
            'data': web3.toHex(root_hash.encode())
        }
        signed_txn = web3.eth.account.sign_transaction(txn, private_key)
        txn_hash = web3.eth.send_raw_transaction(signed_txn.rawTransaction)
        txn_receipt = web3.eth.wait_for_transaction_receipt(txn_hash)
        block_hashes[network] = txn_receipt.blockHash.hex()

    return block_hashes

@app.get("/merkle_proof/{hash_value}")
def get_merkle_proof(hash_value: str):
    """Endpoint to get the Merkle proof for a given hash."""
    merkle_data = load_merkle_tree(MERKLE_FILE)
    if hash_value in merkle_data:
        return {
            "block_number": merkle_data[hash_value]["block_number"],
            "proof": merkle_data[hash_value]["proof"],
            "index": merkle_data[hash_value]["index"],
            "block_hashes": merkle_data["block_hashes"]
        }
    else:
        raise HTTPException(status_code=404, detail="Hash not found in the Merkle tree")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=9595)
