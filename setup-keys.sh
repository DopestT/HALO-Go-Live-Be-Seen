#!/bin/bash
# HALO Security Setup

if [f .env ]; then
  export $(echo $(cat .env | sed 's/#.*//g' | xargs) | envsubst)
  echo "🛡️ Keys detected. Ready to deploy to Vercel/Cloud functions."
  echo "Use 'vercel env add' to sync these safely to your hosting."
else
  echo "❌ Error: .env file not found. Create it first!"
fi
