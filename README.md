# Realcast: Farcaster with Provably Real Media

**Built for ETHGlobal Brussels 2024, Based on Litecast**

A beautiful yet simple Farcaster client which allows you to take and share provably real images. The authenticity of images is guaranteed using cryptographic signatures produced by the device's secure enclave, which are only possible to produce for images that came directly out of the camera sensor. The inbuilt image capture and image viewer tools enable users and third parties to verify the origin and authenticity of the media. We use group signatures via BBS to create a chain of trust that ties the image to a trusted manufacturer of secure camera hardware. This process conceals the signer identities, mitigating the risk of doxxing users and preventing deepfake misinformation. The UI distinguishes images lacking these camera proofs from those with valid proofs, ensuring that only images from trusted hardware are considered authentic.

Crucially, we implement encrypted camera identifiers, allowing only trusted parties to know the true signer identities. This enables the blacklisting of malicious or hacked cameras while ensuring differential privacy and abuse prevention. This blacklisting may be performed whilst preserving anonymity, with retroactive force, instantaneously and at scale, with [MPC privacy features](https://eprint.iacr.org/2022/1362). This is made possible by our custom in-house cryptography libraries, which are included in this project as proprietary blobs.

## Why?

On the 23rd of January, an AI-generated voice message falsely claiming to be President Biden discouraged Democrats from voting in the 2024 primary. Barely a week later, a finance worker lost $25 million to scammers through a deepfake video call mimicking his colleagues. On X (formerly known as Twitter), meanwhile, AI-created explicit images falsely attributed to Taylor Swift attracted 45 million views and sparked wide-spread outrage. These incidents are only a snapshot of the diverse and damaging impact deepfakes can have across politics, finance, and social media.

Forgeries used to be easily detectable by eye, but deepfakes make it easy and cheap to create images almost indistinguishable from real photos. For example, the website “OnlyFake” uses deepfake technology to generate realistic photos of fake IDs in minutes for just $15. The photos have been used to bypass the anti-fraud safeguards, known as Know-Your-Customer (KYC), on OKX (a crypto exchange). In the case of OKX, the deepfake IDs fooled their staff, who are trained to spot doctored images and deepfakes. This highlights that it is no longer possible to detect deepfake-based fraud by eye, even for professionals.

One solution is to detect malicious deepfakes once they’re in the wild instead of preventing their creation. But, deepfake-detecting AI models (such as those deployed by OpenAI) are becoming obsolete due to inaccuracies. Although deepfake detection methods have become more sophisticated, the techniques for creating deepfakes are becoming more sophisticated at a faster rate – the deepfake detectors are losing the technological arms race. Alternative solutions, such as C2PA, are failing to attract adoption due to poor UX or [egregious privacy or scalability deficiencies](https://www.youtube.com/watch?v=-Bdb2KOb_zI).

## Features

- Hardware-backed Security through PlayIntegrity APIs
- Anonymous Attestations based on Group Signatures
  - With minor alterations, it allows people to be added and removed from the set of approved signers entirely anonymous.
  - The revocation of the users signing privileges may be performed retrospectively, without de-anonymising anyone.
- Blockchain-Based Timestamping Server on Base, Polygon and Arbitrum

## Our Contributions

- Mobile bindings to our cryptographic library.
- Inbuilt attested camera and photo viewer.
- Refactored Farcaster client, improved UX.
- Simple data-storage and blockchain time-stamping servers.

## Built with

- [Expo](https://expo.dev)
- FarcasterKit's [farcasterkit-react-native](https://www.npmjs.com/package/farcasterkit-react-native)
- Neynar's [react-native-signin](https://www.npmjs.com/package/@neynar/react-native-signin)
- Veracity Labs' Libraries, with contributions from Andrei Cravtov and Atharva Mahajan

### How to run

1. Set up the app locally

-   `git clone https://github.com/ToxicPine/realcast`
-   `cd realcast && yarn install`

2. Set environment variables

-   Copy `.env.example` to a new `.env` file and add your `NEYNAR_API_KEY`
-   Copy `.eas.example.json` to a new `.eas.json` file and populate with your own values

3. Create Expo project

-   To run the app locally, you'll need to create an account at `https://expo.dev`, then create a new project
-   Once you've created a project, run `npm install --global eas-cli && eas init --id [YOUR PROJECT ID]` to overwrite the existing project with your own

4. Run by calling `yarn start`

### TODOs

- Refactor, since the code is spaghetti.
- Eliminate unwanted or deprecated dependencies.
- Introduce Farcaster Frames.
- Introduce dark mode.
- Introduce reactions and reposts.
- Upgrade the cryptographic libraries to support the dynamic blacklisting of hacked devices.
- Strengthen integrity checks, generate own keys with blinded protocol.
- Fortify time-stamping and data storage, which currently features zero security and little scalability.

### Credits

Realcast is a project for the 2024 ETHGlobal Brussels hackathon, credited to Arbion Halili and Bart Jaworski with special thanks to Andrei Cravtov and Atharva Mahajan from Veracity Labs for building the libraries that make this possible.
