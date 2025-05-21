import { TextractClient, DetectDocumentTextCommand } from "@aws-sdk/client-textract";
import { TranslateClient, TranslateTextCommand } from "@aws-sdk/client-translate";
import { ComprehendClient, DetectKeyPhrasesCommand } from "@aws-sdk/client-comprehend";

const textractClient = new TextractClient({
  region: "us-east-1", // Thay đổi region phù hợp với AWS của bạn
  credentials: {
    accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY,
  },
});

const translateClient = new TranslateClient({
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY,
  },
});

const comprehendClient = new ComprehendClient({
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY,
  },
});

export const extractTextFromDocument = async (file) => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const command = new DetectDocumentTextCommand({
      Document: {
        Bytes: buffer,
      },
    });

    const response = await textractClient.send(command);
    return response.Blocks.map((block) => block.Text).join(" ");
  } catch (error) {
    console.error("Error extracting text:", error);
    throw error;
  }
};

export const translateText = async (text, targetLanguage = "en") => {
  try {
    const command = new TranslateTextCommand({
      Text: text,
      SourceLanguageCode: "auto",
      TargetLanguageCode: targetLanguage,
    });

    const response = await translateClient.send(command);
    return response.TranslatedText;
  } catch (error) {
    console.error("Error translating text:", error);
    throw error;
  }
};

export const summarizeText = async (text) => {
  try {
    const command = new DetectKeyPhrasesCommand({
      Text: text,
      LanguageCode: "en",
    });

    const response = await comprehendClient.send(command);
    const keyPhrases = response.KeyPhrases.map((phrase) => phrase.Text);
    
    // Tạo tóm tắt từ các cụm từ khóa
    const summary = keyPhrases
      .slice(0, 5) // Lấy 5 cụm từ quan trọng nhất
      .join(", ");
    
    return summary;
  } catch (error) {
    console.error("Error summarizing text:", error);
    throw error;
  }
}; 