import "dotenv/config";
import mongoose from "mongoose";
import readline from "node:readline";
import User from "./models/User.js";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: true
});

function ask(question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

async function askHidden(question) {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    let password = "";

    rl.pause();
    process.stdout.write(question);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");

    function onData(char) {
      if (char === "\u0003") {
        stdin.setRawMode(false);
        stdin.pause();
        process.stdout.write("\n");
        process.exit(130);
      }

      if (char === "\r" || char === "\n") {
        stdin.setRawMode(false);
        stdin.removeListener("data", onData);
        stdin.pause();
        process.stdout.write("\n");
        resolve(password);
      } else if (char === "\u007f" || char === "\b") {
        password = password.slice(0, -1);
      } else {
        password += char;
      }
    }

    stdin.on("data", onData);
  });
}

async function main() {
  try {
    const email = (await ask("Enter your registered email: ")).trim();
    const password = await askHidden("Enter your new password (minimum 6 characters): ");

    if (!email || password.length < 6) {
      throw new Error("Email is required and password must contain at least 6 characters.");
    }

    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing. Check your backend .env file.");
    }

    await mongoose.connect(process.env.MONGO_URI);

    const user = await User.findOne({ email });

    if (!user) {
      console.log("No account found for that exact email. No changes were made.");
      return;
    }

    user.password = password;
    await user.save();

    console.log("Password reset successful. Your other account data was not changed.");
  } catch (error) {
    console.error("Password reset failed:", error.message);
    process.exitCode = 1;
  } finally {
    rl.close();
    await mongoose.disconnect().catch(() => {});
  }
}

main();
