# SkillProof Enterprise - Local Development Guide (লোকাল ডেভেলপমেন্ট গাইড)

This document provides step-by-step instructions on how to set up, edit, and run the **SkillProof Enterprise** platform locally on your computer (Windows, Mac, or Linux) without relying on Vercel.

এই ডকুমেন্টটিতে ভার্সেল (Vercel) ছাড়াই আপনার নিজের কম্পিউটার বা ল্যাপটপে (Windows, Mac, Linux) **SkillProof Enterprise** প্ল্যাটফর্মটি সেটআপ, এডিট এবং লোকালি রান করার জন্য বিস্তারিত গাইডলাইন দেওয়া হয়েছে।

---

## English Guide

### 1. Prerequisites
Make sure you have the following installed on your laptop:
- **Node.js** (Recommended: v18.x, v20.x, or newer)
- **npm** (comes packaged with Node.js)
- A text editor or IDE (such as **VS Code**)

### 2. Quick Start Steps

#### Step 2.1: Clone/Extract the Project
Extract the zip package or clone the repository to a folder on your computer. Open your terminal/command prompt and navigate into the project directory:
```bash
cd skillproof-enterprise
```

#### Step 2.2: Install Dependencies
Run the package installer to fetch and build all necessary frontend and backend libraries:
```bash
npm install
```

#### Step 2.3: Configure Environment Variables
Copy the template environment file to create your own local configuration file:
- On Windows (Command Prompt):
  ```cmd
  copy .env.example .env
  ```
- On macOS/Linux or Git Bash:
  ```bash
  cp .env.example .env
  ```

Open the newly created `.env` file in your editor and enter your credentials:
- **`GEMINI_API_KEY`**: Obtain from Google AI Studio.
- **`VITE_GROQ_API_KEY`**: Obtain from Groq Console.
- **`VITE_SUPABASE_URL`** & **`VITE_SUPABASE_ANON_KEY`**: Obtain from your Supabase Project dashboard (Optional - local storage fallback is automatically active if empty).

#### Step 2.4: Launch the Local Development Server
Start the full-stack server locally:
```bash
npm run dev
```

Your server will boot and listen on **`http://localhost:3000`**. Open this URL in your web browser to interact with the platform.

### 3. Production Build & Execution
To verify or run the app in a production-ready environment locally:
```bash
# 1. Build the frontend assets and compile TypeScript server
npm run build

# 2. Start the compiled backend server
npm run start
```

---

## বাংলা গাইডলাইন (Bengali Guide)

### ১. প্রাক-প্রস্তুতি
আপনার ল্যাপটপে নিচের সফটওয়্যারগুলো ইনস্টল করা আছে কিনা নিশ্চিত করুন:
- **Node.js** (কমপক্ষে v18.x, v20.x বা তার বেশি সংস্করণ)
- **npm** (এটি Node.js ইনস্টল করলে সাথে পেয়ে যাবেন)
- কোড এডিট করার জন্য **VS Code** বা যেকোনো এডিটর।

### ২. লোকালি সেটআপ করার ধাপসমূহ

#### ধাপ ২.১: প্রোজেক্ট ডিরেক্টরি ওপেন করা
আপনার ডাউনলোড করা জিপ ফাইলটি আনজিপ করুন অথবা ফোল্ডারটি এডিটরের সাহায্যে ওপেন করুন। আপনার টার্মিনাল বা কমান্ড প্রম্পটে ফোল্ডারের ভেতরে প্রবেশ করুন:
```bash
cd skillproof-enterprise
```

#### ধাপ ২.২: ডিপেন্ডেন্সি ইনস্টল করা
সব ডিপেন্ডেন্সি ও প্যাকেজ ইনস্টল করতে নিচের কমান্ডটি রান করুন:
```bash
npm install
```

#### ধাপ ২.৩: এনভায়রনমেন্ট ভেরিয়েবল সেটআপ (.env)
ফোল্ডারে থাকা `.env.example` ফাইলের একটি কপি তৈরি করে সেটির নাম `.env` দিন:
- Windows (Command Prompt)-এ:
  ```cmd
  copy .env.example .env
  ```
- macOS/Linux অথবা Git Bash-এ:
  ```bash
  cp .env.example .env
  ```

এখন আপনার এডিটরে `.env` ফাইলটি ওপেন করে নিচের কি (keys) গুলো বসান:
- **`GEMINI_API_KEY`**: এটি Google AI Studio থেকে পাবেন।
- **`VITE_GROQ_API_KEY`**: এটি Groq Console থেকে ফ্রিতে পাবেন।
- **`VITE_SUPABASE_URL`** এবং **`VITE_SUPABASE_ANON_KEY`**: এটি Supabase প্রজেক্ট সেটিংস থেকে পাবেন (ঐচ্ছিক - এটি না দিলেও অটোমেটিক লোকাল ব্রাউজার স্টোরেজে ডেটা সেভ থাকবে)।

#### ধাপ ২.৪: লোকাল সার্ভার চালু করা
লোকাল হোস্ট সার্ভার চালু করতে নিচের কমান্ডটি দিন:
```bash
npm run dev
```

সার্ভারটি সফলভাবে চালু হলে ব্রাউজারে **`http://localhost:3000`** অ্যাড্রেসটি ওপেন করে আপনার প্ল্যাটফর্মটি ব্যবহার ও পরীক্ষা করতে পারবেন।

### ৩. প্রোডাকশন বিল্ড ও রান করা
প্রোডাকশন গ্রেড কমপাইল্ড ফাইল জেনারেট করে লোকালি রান করতে নিচের কমান্ডগুলো ব্যবহার করুন:
```bash
# ১. ফ্রন্টএন্ড এবং ব্যাকএন্ড টাইপস্ক্রিপ্ট সার্ভার কমপাইল করার জন্য:
npm run build

# ২. কমপাইল হওয়া সার্ভারটি রান করতে:
npm run start
```

---

## Project Structure & Cleanliness (কোড আর্কিটেকচার)
- **`server.ts`**: The central entry point of the backend (Express + Vite Proxy) which proxies all Groq AI, Gemini AI, and external services safely.
- **`src/`**: Contains the interactive user interface modules.
  - **`components/`**: Highly modular visual tabs and dashboards (`AiSmartCv`, `AiInterview`, `AiAssessment`, etc.).
  - **`contexts/`**: Global context states for user authorization, settings, and multilingual translation.
  - **`lib/`**: Supabase and Groq backend connectors.
- This platform operates perfectly without complex multi-file configurations or temporary setup scripts.
