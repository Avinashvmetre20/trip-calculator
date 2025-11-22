import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const testFilePath = path.join(__dirname, 'test-file.txt');
fs.writeFileSync(testFilePath, 'This is a test file for Supabase upload.');

async function testUpload() {
  const form = new FormData();
  form.append('file', fs.createReadStream(testFilePath));

  try {
    const response = await axios.post('http://localhost:5000/upload', form, {
      headers: {
        ...form.getHeaders(),
      },
    });

    console.log('Upload successful:', response.data);
  } catch (error) {
    console.error('Upload failed:', error.response ? error.response.data : error.message);
  } finally {
    if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath);
    }
  }
}

testUpload();
