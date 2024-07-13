# Realcast ✍️

A beautiful yet simple Farcaster client with image authenticity features using cryptographic signatures produced by the device's enclave. The inbuilt image capture and image viewer tools enable users and third parties to verify the origin and authenticity of the media. We use group signatures via BBS rather than SNARK proofs to create a chain of trust that ties the image to a trusted manufacturer of secure camera hardware. This process conceals the signer identities, mitigating the risk of doxxing users and preventing deepfake misinformation. The UI distinguishes images lacking these camera proofs from those with valid proofs, ensuring that only images from trusted hardware are considered authentic.

Crucially, we implement encrypted camera identifiers, allowing only trusted parties to know the true signer identities. This enables the blacklisting of malicious or hacked cameras while ensuring differential privacy and abuse prevention.

### Built with

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
-   In `constants.ts`, the `API_URL` value is for FarcasterKit's API, which has routes to get/receive the signer and post casts to Neynar. Don't change this value unless you're running the FarcasterKit API locally, but if not change the value to `http://api.farcasterkit.com`
- Set the same values you have in your `.env` file in `eas.json` under the env sections for development and preview

3. Create Expo project

-   To run the app locally, you'll need to create an account at `https://expo.dev`, then create a new project
-   Once you've created a project, run `npm install --global eas-cli && eas init --id [YOUR PROJECT ID]` to overwrite the existing project with your own

4. Run by calling `yarn start`

### Todos
Note: These are just a few todos on the top of my mind that would get the app to v1.0 (full feature parity with the mockups below), but I'm sure smaller tasks and larger ideas will come to mind as well.

-   [] Further style the cast and thread components
-   [] Add search
-   [] Add following channels (via search)
-   [] Add user pages
-   [] Add more of the backend logic to [farcasterkit-react-native](https://www.npmjs.com/package/farcasterkit-react-native) (not much left to move over)
-   [] Add logout capabilities

### Mockups

Here are some mockups to further showcase where the app is headed -- huge shoutout again to [Sirsu](https://warpcast.com/sirsu) for the amazing designs 🙌

|                       Login                        |                       Home                        |
| :------------------------------------------------: | :-----------------------------------------------: |
| ![Realcast Login](https://i.imgur.com/ncsCxVU.png) | ![Realcast Home](https://i.imgur.com/GBlg0fJ.png) |

|                       Search                        |                       Reply                        |
| :-------------------------------------------------: | :------------------------------------------------: |
| ![Realcast Search](https://i.imgur.com/cDsCm95.png) | ![Realcast Reply](https://i.imgur.com/BdhLkTy.png) |

### Credits

Realcast is a project for the 2024 ETHGlobal Brussels hackathon, credited to Arbion Halili and Bart Jaworski with special thanks to Andrei Cravtov and Atharva Mahajan from Veracity Labs for building the libraries that make this possible.
