// Test script to verify Gemini API key
// Run with: node test-gemini-key.js

const { GoogleGenerativeAI } = require('@google/generative-ai');

const API_KEY = 'AIzaSyCbbE0eZtsrO7oTq9F7Zty-RqR8afRSOP4'; // Your key

async function testAPIKey() {
    console.log('Testing Gemini API Key...\n');
    
    // Test different model names
    const modelsToTest = [
        'gemini-1.5-flash',
        'gemini-1.5-flash-8b',
        'gemini-2.5-flash',
        'gemini-2.0-flash-exp',
        'gemini-pro',
    ];

    const genAI = new GoogleGenerativeAI(API_KEY);

    for (const modelName of modelsToTest) {
        try {
            console.log(`Testing model: ${modelName}`);
            const model = genAI.getGenerativeModel({ model: modelName });
            
            const result = await model.generateContent('Say hello in one word');
            const response = await result.response;
            const text = response.text();
            
            console.log(`✅ SUCCESS with ${modelName}`);
            console.log(`   Response: ${text}\n`);
            
            // If one works, we're done
            console.log(`\n🎉 Working model found: ${modelName}`);
            console.log(`\nUpdate your .env file with:\nGEMINI_MODEL=${modelName}`);
            return;
            
        } catch (error) {
            console.log(`❌ FAILED with ${modelName}`);
            console.log(`   Error: ${error.message}\n`);
        }
    }
    
    console.log('\n⚠️  No working models found. Your API key may need activation or verification.');
    console.log('Try:');
    console.log('1. Wait 10 minutes and try again');
    console.log('2. Verify your Google account');
    console.log('3. Create a new API key at https://aistudio.google.com/apikey');
}

testAPIKey().catch(console.error);