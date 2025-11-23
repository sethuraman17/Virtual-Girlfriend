# Intro Demo

https://github.com/user-attachments/assets/967386d5-2002-4a84-bf7a-d823e589fcc0

# AI Interviewer with Custom Avatar and Malpractice Detection

This project is a sophisticated AI-powered interviewer that leverages a custom 3D avatar to create a realistic and interactive experience. It incorporates advanced features, including a malpractice detection system, to ensure the integrity of the interview process. The application is built with a modern tech stack, featuring a React frontend, a Node.js backend, and a custom text-to-speech (TTS) service.

## Key Features

*   **Custom 3D Avatar:** Integrate your own custom avatar from Avaturn to create a personalized and engaging interview experience.
*   **AI-Powered Interviewer:** The AI interviewer is powered by OpenAI's GPT-3, enabling it to ask relevant questions and generate insightful responses.
*   **Malpractice Detection:** The system can detect various forms of malpractice, such as the presence of multiple people, mobile phone usage, and the user looking away from the screen.
*   **Voice Cloning:** The custom TTS service, `chatterbox-tts-api`, allows you to clone your own voice for a more personalized interaction.
*   **Lip-Sync:** The avatar's lip movements are synchronized with the audio using Rhubarb Lip Sync, enhancing the realism of the conversation.

## Avaturn Integration

To create and use your own custom avatar, follow these steps:

1.  **Create your avatar:** Go to the [Avaturn website](https://avaturn.me/) and follow the instructions to create your personalized 3D avatar.
2.  **Download the avatar:** Once you're satisfied with your avatar, download the `.glb` file.
3.  **Add the avatar to the project:** Place the downloaded `.glb` file in the `apps/frontend/public/` directory.
4.  **Update the avatar path:** In the `apps/frontend/src/components/Avatar.jsx` file, update the path to your new avatar file.
5.  <img width="541" height="808" alt="3dimage" src="https://github.com/user-attachments/assets/8ccd5e21-43a6-4deb-9e71-e8c79becd0a1" />

## Malpractice Detection

The malpractice detection system is designed to ensure the integrity of the interview process by identifying and flagging suspicious behavior. The system uses a combination of computer vision and machine learning technologies to monitor the user's activity during the interview.

### Detected Malpractices

*   **Multiple People:** The system can detect the presence of more than one person in the camera's field of view.
*   **Mobile Phone Usage:** The system can identify when a user is holding or looking at a mobile phone.
*   **Looking Away:** The system can track the user's gaze and detect when they are looking away from the screen for an extended period.

### Technologies Used

*   **TensorFlow.js:** A library for machine learning in JavaScript, used for object detection and other computer vision tasks.
*   **face-api.js:** A JavaScript API for face detection and face recognition in the browser.
*   **MediaPipe:** A cross-platform, customizable machine learning solutions for live and streaming media.

## Getting Started

### Prerequisites

*   **Node.js and yarn:** Make sure you have Node.js and yarn installed on your system.
*   **Python:** The `chatterbox-tts-api` requires Python 3.9 or higher.
*   **Rhubarb Lip-Sync:** Download the latest version of Rhubarb Lip-Sync from the [official repository](https://github.com/DanielSWolf/rhubarb-lip-sync/releases). Create a `/bin` directory in the `apps/backend` folder and place the contents of the unzipped file there.
*   **ffmpeg:** Install ffmpeg on your system. You can find instructions for your operating system [here](https://ffmpeg.org/download.html).

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/asanchezyali/talking-avatar-with-ai.git
    cd talking-avatar-with-ai
    ```
2.  **Install dependencies:**
    ```bash
    yarn
    ```
3.  **Set up the chatterbox-tts-api:**
    ```bash
    cd chatterbox-tts-api
    pip install -r requirements.txt
    cd ..
    ```
4.  **Create a `.env` file:** In the `apps/backend` directory, create a `.env` file and add the following environment variables:
    ```
    # OPENAI
    OPENAI_MODEL=<YOUR_GPT_MODEL>
    OPENAI_API_KEY=<YOUR_OPENAI_API_KEY>
    ```
5.  **Run the application:**
    ```bash
    yarn dev
    ```
    This will start the frontend and backend servers. The frontend will be available at `http://localhost:5173`.

## System Architecture

The following diagram illustrates the architecture of the AI interviewer system:

<div align="center">
  <img src="resources/architecture.drawio.svg" alt="System Architecture" width="100%">
</div>
