import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  LinearProgress,
  Paper,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Stack,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import TranslateIcon from '@mui/icons-material/Translate';
import SummarizeIcon from '@mui/icons-material/Summarize';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import Layout from '../components/Layout';
import axios from 'axios';

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

const DocumentAnalysis = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [analysisType, setAnalysisType] = useState('translate'); // 'translate' or 'summarize'
  const [targetLanguage, setTargetLanguage] = useState('en');
  const [summaryLength, setSummaryLength] = useState('medium'); // 'short', 'medium', 'long'
  const [analysisResult, setAnalysisResult] = useState(null);
  const [openResultDialog, setOpenResultDialog] = useState(false);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    setError('');
    setSuccess('');
    setAnalysisResult(null); // Clear previous result
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');
    setAnalysisResult(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('You are not authenticated. Please log in.');
        setUploading(false);
        return;
      }

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('analysisType', analysisType);
      if (analysisType === 'translate') {
        formData.append('targetLanguage', targetLanguage);
      } else {
        formData.append('summaryLength', summaryLength);
      }

      const response = await axios.post('http://localhost:3000/api/analysis', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.data.success) {
        setAnalysisResult({
          originalText: response.data.originalText,
          result: response.data.result,
        });
        setOpenResultDialog(true);
        setSuccess('Analysis completed successfully!');
      } else {
        setError(response.data.message || 'Failed to analyze document');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      setError(error.response?.data?.message || 'Failed to analyze document. Please ensure the file is text-based and readable.');
    } finally {
      setUploading(false);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setAnalysisResult(null);
    setError('');
    setSuccess('');
  };

  const handleCloseResultDialog = () => {
    setOpenResultDialog(false);
    setAnalysisResult(null);
  };

  const handleDownloadResult = () => {
    if (analysisResult?.result) {
      const filename = analysisType === 'translate' ? `translated_text_${Date.now()}.txt` : `summarized_text_${Date.now()}.txt`;
      const blob = new Blob([analysisResult.result], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setSuccess('Analysis result downloaded!');
    }
  };


  return (
    <Layout>
      <Box sx={{ flexGrow: 1, p: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom color="primary.dark">
                  Document Analysis
                </Typography>
                <Box sx={{ mt: 2, mb: 2 }}>
                  <Stack spacing={3}>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                      <Button
                        component="label"
                        variant="contained"
                        startIcon={<CloudUploadIcon />}
                        disabled={uploading}
                        size="large"
                      >
                        Select File for Analysis
                        <VisuallyHiddenInput
                          type="file"
                          onChange={handleFileUpload}
                          accept=".pdf,.doc,.docx,.txt.pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.bmp,.webp,image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,video/*,.mp4,.mov,.avi,.js,.html,.css,.py,.java,.json,.xml,.csv"
                        />
                      </Button>
                      {selectedFile && (
                        <Chip
                          label={selectedFile.name}
                          onDelete={handleClear}
                          color="primary"
                          variant="outlined"
                          sx={{ p: 1 }}
                        />
                      )}
                    </Box>

                    <FormControl fullWidth variant="outlined" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}>
                      <InputLabel>Analysis Type</InputLabel>
                      <Select
                        value={analysisType}
                        label="Analysis Type"
                        onChange={(e) => {
                          setAnalysisType(e.target.value);
                          setAnalysisResult(null);
                        }}
                      >
                        <MenuItem value="translate">Translate Document</MenuItem>
                        <MenuItem value="summarize">Summarize Document</MenuItem>
                      </Select>
                    </FormControl>

                    {analysisType === 'translate' ? (
                      <FormControl fullWidth variant="outlined" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}>
                        <InputLabel>Target Language</InputLabel>
                        <Select
                          value={targetLanguage}
                          label="Target Language"
                          onChange={(e) => setTargetLanguage(e.target.value)}
                        >
                          <MenuItem value="en">English</MenuItem>
                          <MenuItem value="vi">Vietnamese</MenuItem>
                          <MenuItem value="fr">French</MenuItem>
                          <MenuItem value="de">German</MenuItem>
                          <MenuItem value="es">Spanish</MenuItem>
                          <MenuItem value="ja">Japanese</MenuItem>
                          <MenuItem value="ko">Korean</MenuItem>
                          <MenuItem value="zh">Chinese</MenuItem>
                        </Select>
                      </FormControl>
                    ) : (
                      <FormControl fullWidth variant="outlined" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}>
                        <InputLabel>Summary Length</InputLabel>
                        <Select
                          value={summaryLength}
                          label="Summary Length"
                          onChange={(e) => setSummaryLength(e.target.value)}
                        >
                          <MenuItem value="short">Short</MenuItem>
                          <MenuItem value="medium">Medium</MenuItem>
                          <MenuItem value="long">Long</MenuItem>
                        </Select>
                      </FormControl>
                    )}

                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={analysisType === 'translate' ? <TranslateIcon /> : <SummarizeIcon />}
                      onClick={handleAnalyze}
                      disabled={!selectedFile || uploading}
                      fullWidth
                      size="large"
                      sx={{ mt: 2 }}
                    >
                      {analysisType === 'translate' ? 'Translate Document' : 'Summarize Document'}
                    </Button>
                  </Stack>
                </Box>

                {uploading && <LinearProgress sx={{ mt: 2, mb: 2 }} />}
                {error && (
                  <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
                    {error}
                  </Alert>
                )}
                {success && (
                  <Alert severity="success" sx={{ mt: 2, mb: 2 }}>
                    {success}
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      <Dialog
        open={openResultDialog}
        onClose={handleCloseResultDialog}
        maxWidth="md"
        fullWidth
        scroll="paper"
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            {analysisType === 'translate' ? 'Translation Result' : 'Summary Result'}
          </Typography>
          <IconButton onClick={handleCloseResultDialog}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {analysisResult && (
            <Box>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                Original Text:
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, mb: 3, backgroundColor: '#f0f0f0', maxHeight: 300, overflowY: 'auto' }}>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {analysisResult.originalText}
                </Typography>
              </Paper>

              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                {analysisType === 'translate' ? 'Translated Text:' : 'Summarized Text:'}
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, mb: 3, backgroundColor: '#e8f5e9', maxHeight: 300, overflowY: 'auto' }}>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {analysisResult.result}
                </Typography>
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseResultDialog}>Close</Button>
          {analysisResult?.result && (
            <Button onClick={handleDownloadResult} startIcon={<DownloadIcon />} variant="contained">
              Download Result
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Layout>
  );
};

export default DocumentAnalysis;