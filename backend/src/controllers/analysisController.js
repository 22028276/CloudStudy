const AWS = require('aws-sdk');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Cấu hình AWS SDK
AWS.config.update({
  region: process.env.AWS_REGION || 'ap-southeast-1',
});

const s3 = new AWS.S3();
const textract = new AWS.Textract();
const translate = new AWS.Translate();
const comprehend = new AWS.Comprehend();

// Cấu hình multer để xử lý file upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Danh sách ngôn ngữ hỗ trợ
const SUPPORTED_LANGUAGES = {
  'vi': 'Tiếng Việt',
  'en': 'English',
  'ja': '日本語',
  'ko': '한국어',
  'zh': '中文',
  'fr': 'Français',
  'de': 'Deutsch',
  'es': 'Español',
  'ru': 'Русский',
};

// Hàm làm sạch văn bản tiếng Việt
const cleanVietnameseText = (text) => {
  return text
    .replace(/[^\p{L}\p{N}\p{P}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .replace(/([.!?])\s*/g, '$1 ')
    .trim();
};

// Hàm xử lý kết quả từ Textract
const processTextractResult = (blocks) => {
  let text = '';
  let currentLine = '';
  let lastY = null;
  const lineSpacing = 5;

  // Sắp xếp blocks theo vị trí Y và X
  blocks.sort((a, b) => {
    const yDiff = Math.abs(a.Geometry.BoundingBox.Top - b.Geometry.BoundingBox.Top);
    if (yDiff < lineSpacing) {
      return a.Geometry.BoundingBox.Left - b.Geometry.BoundingBox.Left;
    }
    return a.Geometry.BoundingBox.Top - b.Geometry.BoundingBox.Top;
  });

  // Xử lý từng block
  blocks.forEach(block => {
    if (block.BlockType === 'LINE') {
      const y = block.Geometry.BoundingBox.Top;
      
      // Xử lý xuống dòng
      if (lastY === null || Math.abs(y - lastY) > lineSpacing) {
        if (currentLine) {
          text += currentLine + '\n';
          currentLine = '';
        }
        lastY = y;
      }
      
      // Thêm text vào dòng hiện tại
      currentLine += (currentLine ? ' ' : '') + block.Text;
    } else if (block.BlockType === 'WORD') {
      // Xử lý các từ riêng lẻ
      const y = block.Geometry.BoundingBox.Top;
      if (lastY === null || Math.abs(y - lastY) > lineSpacing) {
        if (currentLine) {
          text += currentLine + '\n';
          currentLine = '';
        }
        lastY = y;
      }
      currentLine += (currentLine ? ' ' : '') + block.Text;
    }
  });

  // Thêm dòng cuối cùng
  if (currentLine) {
    text += currentLine;
  }

  return cleanVietnameseText(text);
};

// Hàm xử lý file PDF
const processPDF = async (s3Key) => {
  try {
    const params = {
      Document: {
        S3Object: {
          Bucket: process.env.AWS_S3_BUCKET,
          Name: s3Key
        }
      },
      FeatureTypes: ['TABLES', 'FORMS'],
    };

    // Phân tích toàn bộ tài liệu
    const data = await textract.analyzeDocument(params).promise();
    let text = processTextractResult(data.Blocks);

    // Xử lý bảng
    const tables = data.Blocks.filter(block => block.BlockType === 'TABLE');
    for (const table of tables) {
      const tableText = processTable(table, data.Blocks);
      text += '\n\n' + tableText;
    }

    return text;
  } catch (error) {
    console.error('PDF processing error:', error);
    throw new Error('PDF processing failed: ' + error.message);
  }
};

// Hàm xử lý bảng
const processTable = (table, blocks) => {
  const cells = blocks.filter(block => 
    block.BlockType === 'CELL' && 
    block.TableId === table.Id
  );

  const rows = {};
  cells.forEach(cell => {
    const rowIndex = cell.RowIndex;
    if (!rows[rowIndex]) {
      rows[rowIndex] = [];
    }
    rows[rowIndex].push({
      text: blocks
        .filter(block => 
          block.BlockType === 'WORD' && 
          block.CellId === cell.Id
        )
        .map(block => block.Text)
        .join(' '),
      columnIndex: cell.ColumnIndex
    });
  });

  let tableText = '';
  Object.keys(rows).sort((a, b) => a - b).forEach(rowIndex => {
    const row = rows[rowIndex];
    row.sort((a, b) => a.columnIndex - b.columnIndex);
    tableText += row.map(cell => cell.text).join(' | ') + '\n';
  });

  return tableText;
};

// Hàm xử lý hình ảnh
const processImage = async (s3Key) => {
  try {
    const params = {
      Document: {
        S3Object: {
          Bucket: process.env.AWS_S3_BUCKET,
          Name: s3Key
        }
      }
    };

    // Phát hiện text trong hình ảnh
    const data = await textract.detectDocumentText(params).promise();
    let text = processTextractResult(data.Blocks);

    // Thử phân tích chi tiết hơn nếu có ít text
    if (text.length < 100) {
      const analyzeParams = {
        Document: {
          S3Object: {
            Bucket: process.env.AWS_S3_BUCKET,
            Name: s3Key
          }
        },
        FeatureTypes: ['TABLES', 'FORMS']
      };
      const analyzeData = await textract.analyzeDocument(analyzeParams).promise();
      const additionalText = processTextractResult(analyzeData.Blocks);
      if (additionalText.length > text.length) {
        text = additionalText;
      }
    }

    return text;
  } catch (error) {
    console.error('Image processing error:', error);
    throw new Error('Image processing failed: ' + error.message);
  }
};

// Hàm xử lý file text
const processTextFile = (buffer) => {
  try {
    const text = buffer.toString('utf8');
    return cleanVietnameseText(text);
  } catch (error) {
    console.error('Text file processing error:', error);
    throw new Error('Text file processing failed: ' + error.message);
  }
};

const extractTextFromFile = async (fileBuffer, mimeType) => {
  try {
    const s3Key = `temp/${uuidv4()}-${Date.now()}`;
    await s3.putObject({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: s3Key,
      Body: fileBuffer,
      ContentType: mimeType,
    }).promise();

    let text = '';
    try {
      if (mimeType === 'application/pdf') {
        text = await processPDF(s3Key);
      } else if (mimeType.startsWith('image/')) {
        text = await processImage(s3Key);
      } else {
        text = processTextFile(fileBuffer);
      }
    } finally {
      // Xóa file tạm từ S3
      await s3.deleteObject({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: s3Key
      }).promise();
    }

    if (!text || text.trim().length === 0) {
      throw new Error('No text could be extracted from the file');
    }

    return text;
  } catch (error) {
    console.error('File processing error:', error);
    throw new Error('File processing failed: ' + error.message);
  }
};

// Hàm chia văn bản thành các đoạn nhỏ
const splitTextIntoChunks = (text, maxChunkSize = 4500) => {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const chunks = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > maxChunkSize) {
      if (currentChunk) chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += (currentChunk ? ' ' : '') + sentence;
    }
  }
  if (currentChunk) chunks.push(currentChunk.trim());

  return chunks;
};

// Hàm dịch văn bản với AWS Translate
const translateText = async (text, sourceLanguage, targetLanguage) => {
  try {
    const chunks = splitTextIntoChunks(text);
    const translatedChunks = [];
    
    for (const chunk of chunks) {
      // Xử lý đặc biệt cho các ký tự đặc biệt
      const processedChunk = chunk
        .replace(/\n/g, ' [NEWLINE] ')
        .replace(/\t/g, ' [TAB] ')
        .replace(/\s+/g, ' ');

      const params = {
        SourceLanguageCode: sourceLanguage,
        TargetLanguageCode: targetLanguage,
        Text: processedChunk,
        Settings: {
          Formality: 'FORMAL',
          Profanity: 'MASK'
        }
      };

      const data = await translate.translateText(params).promise();
      let translatedText = data.TranslatedText;

      // Khôi phục các ký tự đặc biệt
      translatedText = translatedText
        .replace(/\[NEWLINE\]/g, '\n')
        .replace(/\[TAB\]/g, '\t')
        .replace(/\s+/g, ' ');

      translatedChunks.push(translatedText);
    }

    return translatedChunks.join(' ');
  } catch (error) {
    console.error('Translation error:', error);
    throw new Error('Translation failed: ' + error.message);
  }
};

// Hàm phân tích câu
const analyzeSentence = async (sentence, language) => {
  try {
    // Phân tích cảm xúc
    const sentimentParams = {
      LanguageCode: language,
      Text: sentence
    };
    const sentimentData = await comprehend.detectSentiment(sentimentParams).promise();

    // Phân tích từ khóa
    const keyPhrasesParams = {
      LanguageCode: language,
      Text: sentence
    };
    const keyPhrasesData = await comprehend.detectKeyPhrases(keyPhrasesParams).promise();

    // Phân tích thực thể
    const entitiesParams = {
      LanguageCode: language,
      Text: sentence
    };
    const entitiesData = await comprehend.detectEntities(entitiesParams).promise();

    return {
      sentence,
      sentiment: sentimentData.Sentiment,
      sentimentScore: sentimentData.SentimentScore,
      keyPhrases: keyPhrasesData.KeyPhrases.map(kp => kp.Text),
      entities: entitiesData.Entities.map(e => e.Text)
    };
  } catch (error) {
    console.error('Sentence analysis error:', error);
    return {
      sentence,
      sentiment: 'NEUTRAL',
      sentimentScore: { Positive: 0.5, Negative: 0.5, Neutral: 0.5, Mixed: 0 },
      keyPhrases: [],
      entities: []
    };
  }
};

// Hàm tóm tắt văn bản với AWS Comprehend
const summarizeText = async (text, sourceLanguage, summaryLength) => {
  try {
    // Chia văn bản thành câu
    const sentences = text.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
    
    // Phân tích từng câu
    const analyzedSentences = await Promise.all(
      sentences.map(sentence => analyzeSentence(sentence, sourceLanguage))
    );

    // Tính điểm quan trọng cho mỗi câu
    const scoredSentences = analyzedSentences.map(analysis => {
      const importanceScore = 
        // Cân nhắc cảm xúc
        (analysis.sentimentScore.Positive + analysis.sentimentScore.Negative) * 0.3 +
        // Cân nhắc số lượng từ khóa
        (analysis.keyPhrases.length / 5) * 0.3 +
        // Cân nhắc số lượng thực thể
        (analysis.entities.length / 3) * 0.4;

      return {
        ...analysis,
        importanceScore
      };
    });

    // Sắp xếp câu theo độ quan trọng
    scoredSentences.sort((a, b) => b.importanceScore - a.importanceScore);

    // Xác định số câu cần tóm tắt
    const length = summaryLength === 'short' ? 3 : summaryLength === 'long' ? 15 : 7;
    const selectedSentences = scoredSentences.slice(0, length);

    // Sắp xếp lại câu theo thứ tự ban đầu
    selectedSentences.sort((a, b) => 
      sentences.indexOf(a.sentence) - sentences.indexOf(b.sentence)
    );

    // Tạo tóm tắt
    const summary = selectedSentences
      .map(s => s.sentence)
      .join('. ') + '.';

    return summary;
  } catch (error) {
    console.error('Summarization error:', error);
    throw new Error('Summarization failed: ' + error.message);
  }
};

const detectLanguage = async (text) => {
  try {
    const params = {
      Text: text.slice(0, 1000),
    };
    const data = await comprehend.detectDominantLanguage(params).promise();
    return data.Languages && data.Languages[0]?.LanguageCode || 'en';
  } catch (error) {
    console.error('Error detecting language:', error);
    return 'en';
  }
};

// Hàm tạo file tạm
const createTempFile = async (content, extension) => {
  const tempDir = os.tmpdir();
  const fileName = `translation-${Date.now()}.${extension}`;
  const filePath = path.join(tempDir, fileName);
  
  await fs.promises.writeFile(filePath, content, 'utf8');
  return { filePath, fileName };
};

const analysisController = {
  analyze: async (req, res) => {
    try {
      const { analysisType, targetLanguage, summaryLength } = req.body;
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ 
          success: false, 
          message: 'No file uploaded' 
        });
      }

      if (analysisType === 'translate' && !targetLanguage) {
        return res.status(400).json({
          success: false,
          message: 'Target language is required for translation',
          supportedLanguages: SUPPORTED_LANGUAGES
        });
      }

      const text = await extractTextFromFile(file.buffer, file.mimetype);
      if (!text) {
        return res.status(400).json({ 
          success: false, 
          message: 'Could not extract text from file' 
        });
      }

      const sourceLanguage = await detectLanguage(text);
      console.log('Detected source language:', sourceLanguage);

      let result = '';
      let tempFile = null;

      if (analysisType === 'translate') {
        result = await translateText(text, sourceLanguage, targetLanguage);
        
        // Tạo file tạm cho kết quả dịch
        const extension = path.extname(file.originalname) || '.txt';
        tempFile = await createTempFile(result, extension);
        
        // Upload file lên S3
        const s3Key = `translations/${uuidv4()}-${tempFile.fileName}`;
        await s3.putObject({
          Bucket: process.env.AWS_S3_BUCKET,
          Key: s3Key,
          Body: result,
          ContentType: 'text/plain',
        }).promise();

        // Tạo URL tạm thời cho file
        const signedUrl = await s3.getSignedUrlPromise('getObject', {
          Bucket: process.env.AWS_S3_BUCKET,
          Key: s3Key,
          Expires: 3600 // URL hết hạn sau 1 giờ
        });

        return res.json({ 
          success: true, 
          originalText: text, 
          result,
          sourceLanguage,
          targetLanguage,
          supportedLanguages: SUPPORTED_LANGUAGES,
          downloadUrl: signedUrl,
          fileName: tempFile.fileName
        });
      } else if (analysisType === 'summarize') {
        result = await summarizeText(text, sourceLanguage, summaryLength);
        return res.json({ 
          success: true, 
          originalText: text, 
          result,
          sourceLanguage,
          supportedLanguages: SUPPORTED_LANGUAGES
        });
      }
    } catch (error) {
      console.error('Analysis error:', error);
      return res.status(500).json({ 
        success: false, 
        message: error.message,
        supportedLanguages: SUPPORTED_LANGUAGES
      });
    }
  },
  upload,
};

module.exports = analysisController; 