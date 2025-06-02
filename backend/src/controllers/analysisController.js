const AWS = require('aws-sdk');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Cấu hình AWS SDK
AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1', // Đảm bảo vùng hợp lệ
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
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

// Danh sách ngôn ngữ hỗ trợ (Translate hỗ trợ nhiều hơn, đây chỉ là ví dụ)
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
  'ar': 'العربية',
  'pt': 'Português',
  'it': 'Italiano',
  'th': 'ภาษาไทย',
};

// Hàm làm sạch văn bản
const cleanText = (text) => {
  return text
    .replace(/[^\p{L}\p{N}\p{P}\s]/gu, ' ') // Giữ lại chữ cái, số, dấu câu và khoảng trắng
    .replace(/\s+/g, ' ') // Thay thế nhiều khoảng trắng bằng một khoảng trắng
    .replace(/([.!?])\s*/g, '$1 ') // Đảm bảo có khoảng trắng sau dấu câu
    .trim();
};

// Hàm xây dựng lại văn bản từ các block của Textract
const buildTextFromBlocks = (blocks) => {
    const blockMap = new Map();
    blocks.forEach(block => blockMap.set(block.Id, block));

    let fullText = '';

    // Lọc ra các blocks kiểu PAGE và sắp xếp theo số trang
    const pageBlocks = blocks.filter(block => block.BlockType === 'PAGE').sort((a, b) => (a.Page || 0) - (b.Page || 0));

    pageBlocks.forEach(pageBlock => {
        // Đã loại bỏ việc thêm "--- Page X ---" ở đây theo yêu cầu
        // const pageNumber = pageBlock.Page || 'Unknown';
        // if (fullText.length > 0) {
        //     fullText += `\n\n--- Page ${pageNumber} ---\n\n`; // Phân cách rõ ràng giữa các trang
        // } else {
        //     fullText += `--- Page ${pageNumber} ---\n\n`;
        // }

        // Lấy tất cả các ID của các block con trực tiếp của trang
        const pageChildIds = pageBlock.Relationships?.find(rel => rel.Type === 'CHILD')?.Ids || [];
        // Lọc các block con mà chúng ta quan tâm: LINE, TABLE, KEY_VALUE_SET
        const relevantPageChildren = pageChildIds
            .map(id => blockMap.get(id))
            .filter(block => block && ['LINE', 'TABLE', 'KEY_VALUE_SET'].includes(block.BlockType));

        // Sắp xếp các khối con (LINE, TABLE, KEY_VALUE_SET) theo vị trí trên trang
        relevantPageChildren.sort((a, b) => {
            const yA = a.Geometry.BoundingBox.Top;
            const yB = b.Geometry.BoundingBox.Top;
            const xA = a.Geometry.BoundingBox.Left;
            const xB = b.Geometry.BoundingBox.Left;

            const VERTICAL_ALIGNMENT_THRESHOLD = 0.01; // Ngưỡng nhỏ để coi là cùng "dòng ngang"
            const maxChildHeight = Math.max(a.Geometry.BoundingBox.Height || 0, b.Geometry.BoundingBox.Height || 0);

            // Nếu vị trí Y rất gần nhau, sắp xếp theo X
            if (Math.abs(yA - yB) < VERTICAL_ALIGNMENT_THRESHOLD * maxChildHeight) {
                return xA - xB;
            }
            // Ngược lại, sắp xếp theo Y
            return yA - yB;
        });

        relevantPageChildren.forEach(childBlock => {
            if (childBlock.BlockType === 'LINE') {
                fullText += childBlock.Text + '\n';
            } else if (childBlock.BlockType === 'TABLE') {
                fullText += '\n\nTable Data:\n';
                fullText += processTable(childBlock, blocks) + '\n';
            } else if (childBlock.BlockType === 'KEY_VALUE_SET') {
                const keyId = childBlock.Relationships?.find(rel => rel.Type === 'CHILD')?.Ids[0];
                const keyBlock = keyId ? blockMap.get(keyId) : null;
                const keyText = keyBlock?.BlockType === 'WORD' ? keyBlock.Text : '';

                const valueId = childBlock.Relationships?.find(rel => rel.Type === 'VALUE')?.Ids[0];
                const valueBlock = valueId ? blockMap.get(valueId) : null;
                const valueText = (valueBlock?.Relationships?.find(rel => rel.Type === 'CHILD')?.Ids || [])
                                    .map(id => blockMap.get(id))
                                    .filter(b => b?.BlockType === 'WORD')
                                    .map(b => b.Text)
                                    .join(' ');
                
                if (keyText) {
                    fullText += `\nForm Field: ${keyText}: ${valueText}\n`;
                }
            }
        });
    });

    return cleanText(fullText);
};

// Hàm xử lý bảng
const processTable = (tableBlock, allBlocks) => {
    const blockMap = new Map();
    allBlocks.forEach(block => blockMap.set(block.Id, block));

    const cells = tableBlock.Relationships?.find(rel => rel.Type === 'CHILD')?.Ids
        .map(id => blockMap.get(id))
        .filter(block => block && block.BlockType === 'CELL') || [];

    const rows = {};
    cells.forEach(cell => {
        const rowIndex = cell.RowIndex;
        const columnIndex = cell.ColumnIndex;
        if (!rows[rowIndex]) {
            rows[rowIndex] = [];
        }
        const cellText = (cell.Relationships?.find(rel => rel.Type === 'CHILD')?.Ids || [])
            .map(id => blockMap.get(id))
            .filter(block => block && block.BlockType === 'WORD')
            .map(wordBlock => wordBlock.Text)
            .join(' ');

        rows[rowIndex].push({
            text: cellText,
            columnIndex: columnIndex
        });
    });

    let tableOutput = '';
    const sortedRowKeys = Object.keys(rows).sort((a, b) => parseInt(a) - parseInt(b));
    sortedRowKeys.forEach(rowIndex => {
        const row = rows[rowIndex];
        row.sort((a, b) => a.columnIndex - b.columnIndex);
        tableOutput += row.map(cell => `"${cell.text.replace(/"/g, '""')}"`).join(',') + '\n';
    });
    return tableOutput;
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

    const data = await textract.analyzeDocument(params).promise();
    let text = buildTextFromBlocks(data.Blocks);

    return text;
  } catch (error) {
    console.error('PDF processing error:', error);
    throw new Error('PDF processing failed: ' + error.message);
  }
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

    const data = await textract.analyzeDocument(params).promise();
    let text = buildTextFromBlocks(data.Blocks);

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
    return cleanText(text);
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
      } else if (mimeType.startsWith('text/')) {
        text = processTextFile(fileBuffer);
      } else {
        throw new Error('Unsupported file type for text extraction.');
      }
    } finally {
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
const splitTextIntoChunks = (text, maxChunkSize = 4800) => {
  const sentences = text.split(/(?<=[.!?])\s+|\n+/).filter(s => s.trim().length > 0);
  const chunks = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    if (sentence.length > maxChunkSize) {
        let tempSentence = sentence;
        while (tempSentence.length > 0) {
            chunks.push(tempSentence.substring(0, maxChunkSize));
            tempSentence = tempSentence.substring(maxChunkSize);
        }
    } else if ((currentChunk + ' ' + sentence).trim().length > maxChunkSize) {
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
      const params = {
        SourceLanguageCode: sourceLanguage,
        TargetLanguageCode: targetLanguage,
        Text: chunk,
        Settings: {
          Formality: 'FORMAL',
          Profanity: 'MASK'
        }
      };

      const data = await translate.translateText(params).promise();
      translatedChunks.push(data.TranslatedText);
    }

    return translatedChunks.join(' ');
  } catch (error) {
    console.error('Translation error:', error);
    if (error.code === 'UnsupportedLanguagePairException') {
        throw new Error(`Translation failed: The language pair "${sourceLanguage}" to "${targetLanguage}" might not be supported by AWS Translate.`);
    }
    throw new Error('Translation failed: ' + error.message);
  }
};

// Hàm phân tích câu
const analyzeSentence = async (sentence, language) => {
  try {
    if (!sentence || sentence.trim().length === 0) {
        return {
            sentence, sentiment: 'NEUTRAL', sentimentScore: {}, keyPhrases: [], entities: []
        };
    }

    const sentimentParams = { LanguageCode: language, Text: sentence };
    const sentimentData = await comprehend.detectSentiment(sentimentParams).promise();

    const keyPhrasesParams = { LanguageCode: language, Text: sentence };
    const keyPhrasesData = await comprehend.detectKeyPhrases(keyPhrasesParams).promise();

    const entitiesParams = { LanguageCode: language, Text: sentence };
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

// Hàm tính độ tương đồng đơn giản giữa hai câu (dựa trên từ chung)
const calculateSentenceSimilarity = (sentenceA, sentenceB) => {
    const wordsA = new Set(sentenceA.toLowerCase().split(/\W+/).filter(w => w.length > 0));
    const wordsB = new Set(sentenceB.toLowerCase().split(/\W+/).filter(w => w.length > 0));

    if (wordsA.size === 0 || wordsB.size === 0) return 0;

    const intersection = new Set([...wordsA].filter(word => wordsB.has(word))).size;
    const union = wordsA.size + wordsB.size - intersection;
    
    return intersection / union; // Jaccard similarity
};

// Hàm tóm tắt văn bản với AWS Comprehend
const summarizeText = async (text, sourceLanguage, summaryLength) => {
  try {
    const sentences = text.split(/(?<=[.!?])\s+|\n+/).filter(s => s.trim().length > 0);
    
    if (sentences.length <= 5 && summaryLength === 'short') {
        return sentences.join('. ').trim();
    }
    if (sentences.length <= 10 && summaryLength === 'medium') {
        return sentences.join('. ').trim();
    }
    if (sentences.length <= 15 && summaryLength === 'long') {
        return sentences.join('. ').trim();
    }

    const analyzedSentences = await Promise.all(
      sentences.map(sentence => analyzeSentence(sentence, sourceLanguage))
    );

    const scoredSentences = analyzedSentences.map(analysis => {
      const sentimentWeight = 0.1;
      const keyPhraseWeight = 0.5;
      const entityWeight = 0.4;

      const importanceScore = 
        (analysis.sentimentScore.Positive + analysis.sentimentScore.Negative) * sentimentWeight +
        (analysis.keyPhrases.length / Math.max(1, analysis.sentence.split(' ').length)) * keyPhraseWeight +
        (analysis.entities.length / Math.max(1, analysis.sentence.split(' ').length)) * entityWeight;
      
      const index = sentences.indexOf(analysis.sentence);
      if (index === 0) {
          analysis.importanceScore = importanceScore * 1.5; 
      } else if (index === sentences.length - 1) {
          analysis.importanceScore = importanceScore * 1.2;
      } else {
          analysis.importanceScore = importanceScore;
      }
      if (/\d+/.test(analysis.sentence)) {
        analysis.importanceScore *= 1.1;
      }

      return analysis;
    });

    scoredSentences.sort((a, b) => b.importanceScore - a.importanceScore);

    let numSentencesToSummarize;
    if (summaryLength === 'short') {
      numSentencesToSummarize = Math.max(2, Math.ceil(sentences.length * 0.10));
    } else if (summaryLength === 'long') {
      numSentencesToSummarize = Math.max(10, Math.ceil(sentences.length * 0.35));
    } else {
      numSentencesToSummarize = Math.max(5, Math.ceil(sentences.length * 0.20));
    }
    numSentencesToSummarize = Math.min(numSentencesToSummarize, sentences.length);

    const selectedSentences = scoredSentences.slice(0, numSentencesToSummarize);

    const finalSummarySentences = [];
    // Đã điều chỉnh ngưỡng tương đồng
    const similarityThreshold = 0.55; // Giảm ngưỡng để loại bỏ nhiều trùng lặp hơn
    
    selectedSentences.sort((a, b) => 
        sentences.indexOf(a.sentence) - sentences.indexOf(b.sentence)
    );

    selectedSentences.forEach(newSentenceAnalysis => {
        const isDuplicate = finalSummarySentences.some(existingSentenceText => {
            return calculateSentenceSimilarity(newSentenceAnalysis.sentence, existingSentenceText) > similarityThreshold;
        });

        if (!isDuplicate) {
            finalSummarySentences.push(newSentenceAnalysis.sentence);
        }
    });

    let summary = finalSummarySentences
      .join('. ') + (finalSummarySentences.length > 0 && !finalSummarySentences[finalSummarySentences.length - 1].endsWith('.') ? '.' : '');
    
    // Thêm bước làm sạch để loại bỏ dấu chấm kép
    summary = summary.replace(/\.\.+/g, '.');

    return summary;
  } catch (error) {
    console.error('Summarization error:', error);
    throw new Error('Summarization failed: ' + error.message);
  }
};

const detectLanguage = async (text) => {
  try {
    const params = {
      Text: text.slice(0, 4500),
    };
    const data = await comprehend.detectDominantLanguage(params).promise();
    return data.Languages && data.Languages[0]?.LanguageCode || 'en';
  } catch (error) {
    console.error('Error detecting language:', error);
    return 'en';
  }
};

const createTempFile = async (content, extension) => {
  const tempDir = os.tmpdir();
  const fileName = `translation-${uuidv4()}-${Date.now()}${extension}`;
  const filePath = path.join(tempDir, fileName);
  
  await fs.promises.writeFile(filePath, content, 'utf8');
  return { filePath, fileName };
};

const analysisController = {
  analyze: async (req, res) => {
    let tempFile = null;
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

      const supportedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/tiff', 'text/plain'];
      if (!supportedMimeTypes.includes(file.mimetype) && !file.mimetype.startsWith('text/')) {
          return res.status(400).json({
              success: false,
              message: `Unsupported file type: ${file.mimetype}. Supported types are: PDF, JPEG, PNG, TIFF, and Text files.`,
              supportedLanguages: SUPPORTED_LANGUAGES
          });
      }

      const text = await extractTextFromFile(file.buffer, file.mimetype);
      if (!text || text.trim().length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Could not extract text from file or extracted text is empty.' 
        });
      }

      const sourceLanguage = await detectLanguage(text);
      console.log('Detected source language:', sourceLanguage);

      let result = '';
      

      if (analysisType === 'translate') {
        if (sourceLanguage === targetLanguage) {
          result = text;
        } else {
          result = await translateText(text, sourceLanguage, targetLanguage);
        }
        
        const extension = path.extname(file.originalname) || '.txt';
        tempFile = await createTempFile(result, extension);
        
        const s3Key = `translations/${uuidv4()}-${tempFile.fileName}`;
        await s3.putObject({
          Bucket: process.env.AWS_S3_BUCKET,
          Key: s3Key,
          Body: result,
          ContentType: 'text/plain',
          ACL: 'private'
        }).promise();

        const signedUrl = await s3.getSignedUrlPromise('getObject', {
          Bucket: process.env.AWS_S3_BUCKET,
          Key: s3Key,
          Expires: 3600
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
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid analysisType. Supported types are "translate" and "summarize".'
        });
      }
    } catch (error) {
      console.error('Analysis error:', error);
      return res.status(500).json({ 
        success: false, 
        message: error.message,
        supportedLanguages: SUPPORTED_LANGUAGES
      });
    } finally {
      if (tempFile && fs.existsSync(tempFile.filePath)) {
          await fs.promises.unlink(tempFile.filePath).catch(err => console.error('Error deleting local temp file:', err));
      }
    }
  },
  upload,
};

module.exports = analysisController;