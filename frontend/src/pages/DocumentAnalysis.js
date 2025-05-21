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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
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
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import VisibilityIcon from '@mui/icons-material/Visibility';
import Layout from '../components/Layout';

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

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[4],
  },
}));

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

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    setError('');
    setSuccess('');
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('analysisType', analysisType);
      
      if (analysisType === 'translate') {
        formData.append('targetLanguage', targetLanguage);
      } else {
        formData.append('summaryLength', summaryLength);
      }

      // TODO: Implement API call to backend
      // const response = await axios.post('/api/analyze', formData);
      // setAnalysisResult(response.data);
      // setOpenResultDialog(true);
      // setSuccess('Analysis completed successfully!');

    } catch (error) {
      console.error('Analysis error:', error);
      setError(error.response?.data?.message || 'Failed to analyze document');
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

  return (
    <Layout>
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <StyledCard>
              <CardContent>
                <Typography variant="h5" gutterBottom>
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
                      >
                        Select File
                        <VisuallyHiddenInput
                          type="file"
                          onChange={handleFileUpload}
                        />
                      </Button>
                      {selectedFile && (
                        <Chip
                          label={selectedFile.name}
                          onDelete={handleClear}
                          color="primary"
                        />
                      )}
                    </Box>

                    <FormControl fullWidth>
                      <InputLabel>Analysis Type</InputLabel>
                      <Select
                        value={analysisType}
                        label="Analysis Type"
                        onChange={(e) => setAnalysisType(e.target.value)}
                      >
                        <MenuItem value="translate">Translate Document</MenuItem>
                        <MenuItem value="summarize">Summarize Document</MenuItem>
                      </Select>
                    </FormControl>

                    {analysisType === 'translate' ? (
                      <FormControl fullWidth>
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
                      <FormControl fullWidth>
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
                    >
                      {analysisType === 'translate' ? 'Translate' : 'Summarize'}
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
            </StyledCard>
          </Grid>
        </Grid>
      </Box>

      <Dialog
        open={openResultDialog}
        onClose={() => setOpenResultDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {analysisType === 'translate' ? 'Translation Result' : 'Summary Result'}
        </DialogTitle>
        <DialogContent>
          {analysisResult && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Original Text
              </Typography>
              <Paper sx={{ p: 2, mb: 2, maxHeight: 200, overflow: 'auto' }}>
                <Typography>{analysisResult.originalText}</Typography>
              </Paper>

              <Typography variant="h6" gutterBottom>
                {analysisType === 'translate' ? 'Translated Text' : 'Summary'}
              </Typography>
              <Paper sx={{ p: 2, maxHeight: 400, overflow: 'auto' }}>
                <Typography>{analysisResult.result}</Typography>
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenResultDialog(false)}>Close</Button>
          <Button
            variant="contained"
            onClick={() => {
              // TODO: Implement download functionality
            }}
          >
            Download Result
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
};

export default DocumentAnalysis; 