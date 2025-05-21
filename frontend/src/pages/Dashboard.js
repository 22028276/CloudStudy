import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
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
  Chip,
  TextField,
  InputAdornment,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SearchIcon from '@mui/icons-material/Search';
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

const Dashboard = () => {
  const [files, setFiles] = useState([]);
  const [filteredFiles, setFilteredFiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [previewType, setPreviewType] = useState('');
  const [previewText, setPreviewText] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchFiles();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredFiles(files);
    } else {
      const filtered = files.filter(file => 
        file.originalName.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredFiles(filtered);
    }
  }, [searchQuery, files]);

  const fetchFiles = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get('http://localhost:3000/api/documents', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFiles(response.data.data || []);
    } catch (error) {
      console.error('Error fetching files:', error);
      setError('Failed to load files');
      if (error.response?.status === 401) {
        navigate('/login');
      }
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    setUploading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:3000/api/documents/upload', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      if (response.data.success) {
        setSuccess('File uploaded and processed successfully!');
        fetchFiles();
      } else {
        setError(response.data.message || 'Failed to upload file');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setError(error.response?.data?.message || 'Failed to upload file');
      if (error.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (documentId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:3000/api/documents/${documentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('File deleted successfully!');
      fetchFiles();
    } catch (error) {
      console.error('Error deleting file:', error);
      setError('Failed to delete file');
      if (error.response?.status === 401) {
        navigate('/login');
      }
    }
  };

  const handleDownload = async (documentId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:3000/api/documents/${documentId}/url`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('URL response:', response.data);

      if (response.data.success && response.data.data?.downloadUrl) {
        const fileUrl = response.data.data.downloadUrl;
        
        try {
          console.log('Downloading file from:', fileUrl);
          
          // Tải file
          const fileResponse = await axios.get(fileUrl, {
            headers: { Authorization: `Bearer ${token}` },
            responseType: 'blob'
          });
          
          if (fileResponse.status === 200 && fileResponse.data) {
            // Tạo blob URL và tải xuống
            const blob = new Blob([fileResponse.data], { type: fileResponse.headers['content-type'] });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = response.data.data.fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
          } else {
            throw new Error(`Failed to download file: ${fileResponse.status} ${fileResponse.statusText}`);
          }
        } catch (fileError) {
          console.error('Error downloading file:', fileError);
          setError(`Failed to download file: ${fileError.message}`);
        }
      } else {
        setError('Failed to get download URL');
      }
    } catch (error) {
      console.error('Error getting download URL:', error);
      setError(error.response?.data?.message || 'Failed to get download URL');
    }
  };

  const handleViewAnalysis = async (document) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:3000/api/documents/${document._id}/url`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('URL response:', response.data);

      if (response.data.success && response.data.data?.previewUrl) {
        const fileUrl = response.data.data.previewUrl;
        
        try {
          console.log('Loading file preview from:', fileUrl);
          
          // Tạo blob URL cho file
          const fileResponse = await axios.get(fileUrl, {
            headers: { Authorization: `Bearer ${token}` },
            responseType: 'blob'
          });
          
          if (fileResponse.status === 200 && fileResponse.data) {
            const blob = new Blob([fileResponse.data], { type: document.mimeType });
            const blobUrl = URL.createObjectURL(blob);

            // Nếu là file text/code, đọc nội dung
            let content = null;
            if (document.mimeType.startsWith('text/') || 
                document.mimeType === 'application/json' ||
                document.mimeType === 'application/xml' ||
                document.mimeType.startsWith('application/javascript') ||
                document.mimeType.startsWith('text/x-')) {
              content = await fileResponse.data.text();
            }

            setSelectedDocument({
              ...document,
              url: blobUrl,
              content: content
            });
            setOpenDialog(true);
          } else {
            throw new Error(`Failed to load file preview: ${fileResponse.status} ${fileResponse.statusText}`);
          }
        } catch (fileError) {
          console.error('Error loading file preview:', fileError);
          setError(`Failed to load file preview: ${fileError.message}`);
        }
      } else {
        setError('Failed to get file preview URL');
      }
    } catch (error) {
      console.error('Error getting file preview URL:', error);
      setError(error.response?.data?.message || 'Failed to get file preview URL');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Layout>
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <StyledCard>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  Document Management
                </Typography>
                <Box sx={{ mt: 2, mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
                  <Button
                    component="label"
                    variant="contained"
                    startIcon={<CloudUploadIcon />}
                    disabled={uploading}
                  >
                    Upload File
                    <VisuallyHiddenInput
                      type="file"
                      onChange={handleFileUpload}
                    />
                  </Button>
                  <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Search documents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
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

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>File Name</TableCell>
              <TableCell align="right">Size</TableCell>
              <TableCell align="right">Upload Date</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredFiles.map((file) => (
              <TableRow key={file._id}>
                <TableCell component="th" scope="row">
                  {file.originalName}
                </TableCell>
                <TableCell align="right">{formatFileSize(file.size)}</TableCell>
                <TableCell align="right">
                  {new Date(file.createdAt).toLocaleString()}
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="View Analysis">
                    <IconButton
                      color="primary"
                      onClick={() => handleViewAnalysis(file)}
                    >
                      <VisibilityIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Download">
                    <IconButton
                      color="primary"
                      onClick={() => handleDownload(file._id)}
                    >
                      <DownloadIcon />
                    </IconButton>
                  </Tooltip>
                  <IconButton
                    color="error"
                    onClick={() => handleDelete(file._id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {filteredFiles.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  {searchQuery ? 'No matching files found' : 'No files uploaded yet'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>File Preview</DialogTitle>
        <DialogContent>
          {selectedDocument && (
            <Box>
              {selectedDocument.mimeType.startsWith('image/') ? (
                <img 
                  src={selectedDocument.url} 
                  alt={selectedDocument.originalName}
                  style={{ maxWidth: '100%', height: 'auto' }}
                />
              ) : selectedDocument.mimeType === 'application/pdf' ? (
                <iframe
                  src={selectedDocument.url}
                  width="100%"
                  height="600px"
                  title={selectedDocument.originalName}
                />
              ) : selectedDocument.mimeType.startsWith('video/') ? (
                <video
                  controls
                  style={{ maxWidth: '100%', maxHeight: '600px' }}
                >
                  <source src={selectedDocument.url} type={selectedDocument.mimeType} />
                  Your browser does not support the video tag.
                </video>
              ) : selectedDocument.mimeType.startsWith('text/') || 
                  selectedDocument.mimeType === 'application/json' ||
                  selectedDocument.mimeType === 'application/xml' ||
                  selectedDocument.mimeType.startsWith('application/javascript') ||
                  selectedDocument.mimeType.startsWith('text/x-') ? (
                <Box sx={{ 
                  backgroundColor: '#f5f5f5', 
                  padding: 2, 
                  borderRadius: 1,
                  maxHeight: '600px',
                  overflow: 'auto'
                }}>
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                    {selectedDocument.content}
                  </pre>
                </Box>
              ) : selectedDocument.mimeType.startsWith('application/vnd.openxmlformats-officedocument') ||
                  selectedDocument.mimeType.startsWith('application/vnd.ms-') ? (
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center',
                  gap: 2,
                  padding: 3
                }}>
                  <Typography variant="h6">
                    Office Document Preview
                  </Typography>
                  <Typography>
                    This document can be previewed using Microsoft Office Online or Google Docs.
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => window.open(selectedDocument.url, '_blank')}
                  >
                    Open in New Tab
                  </Button>
                </Box>
              ) : (
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center',
                  gap: 2,
                  padding: 3
                }}>
                  <Typography variant="h6">
                    Preview Not Available
                  </Typography>
                  <Typography>
                    This file type cannot be previewed directly. Please download to view.
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => handleDownload(selectedDocument._id)}
                  >
                    Download File
                  </Button>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
};

export default Dashboard; 