const { textractClient, comprehendClient } = require('../config/aws');
const { DetectDocumentTextCommand } = require('@aws-sdk/client-textract');
const { DetectEntitiesCommand, DetectKeyPhrasesCommand } = require('@aws-sdk/client-comprehend');

class AWSService {
  async extractText(fileBuffer) {
    try {
      const command = new DetectDocumentTextCommand({
        Document: {
          Bytes: fileBuffer
        }
      });

      const response = await textractClient.send(command);
      return response.Blocks
        .filter(block => block.BlockType === 'LINE')
        .map(block => block.Text)
        .join('\n');
    } catch (error) {
      throw new Error(`Text extraction error: ${error.message}`);
    }
  }

  async analyzeText(text) {
    try {
      // Detect entities
      const entitiesCommand = new DetectEntitiesCommand({
        Text: text,
        LanguageCode: 'en'
      });
      const entitiesResponse = await comprehendClient.send(entitiesCommand);

      // Detect key phrases
      const keyPhrasesCommand = new DetectKeyPhrasesCommand({
        Text: text,
        LanguageCode: 'en'
      });
      const keyPhrasesResponse = await comprehendClient.send(keyPhrasesCommand);

      return {
        entities: entitiesResponse.Entities,
        keyPhrases: keyPhrasesResponse.KeyPhrases
      };
    } catch (error) {
      throw new Error(`Text analysis error: ${error.message}`);
    }
  }
}

module.exports = new AWSService(); 