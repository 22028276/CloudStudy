import React, { useState, useEffect, useCallback } from 'react';
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
  TextField,
  InputAdornment,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
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

const Dashboard = () => {
  const [files, setFiles] = useState([]);
  const [filteredFiles, setFilteredFiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const navigate = useNavigate();

  const fetchFiles = useCallback(async () => {
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
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      }
    }
  }, [navigate]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

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

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    setUploading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:3000/api/documents/upload', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`Upload progress: ${percentCompleted}%`);
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
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      }
    } finally {
      setUploading(false);
      event.target.value = null;
    }
  };

  const handleDelete = async (documentId) => {
    if (!window.confirm('Are you sure you want to delete this file?')) {
      return;
    }
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
        localStorage.removeItem('token');
        localStorage.removeItem('user');
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

      if (response.data.success && response.data.data?.downloadUrl) {
        const fileUrl = response.data.data.downloadUrl;

        try {
          const fileResponse = await axios.get(fileUrl, {
            headers: { Authorization: `Bearer ${token}` },
            responseType: 'blob'
          });

          if (fileResponse.status === 200 && fileResponse.data) {
            const blob = new Blob([fileResponse.data], { type: fileResponse.headers['content-type'] });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = response.data.data.fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            setSuccess('File downloaded successfully!');
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
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      }
    }
  };

  const handleViewAnalysis = async (document) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:3000/api/documents/${document._id}/url`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success && response.data.data?.previewUrl) {
        const fileUrl = response.data.data.previewUrl;

        try {
          const fileResponse = await axios.get(fileUrl, {
            headers: { Authorization: `Bearer ${token}` },
            responseType: 'blob'
          });

          if (fileResponse.status === 200 && fileResponse.data) {
            const blob = new Blob([fileResponse.data], { type: document.mimeType });
            const blobUrl = URL.createObjectURL(blob);

            let content = null;
            if (document.mimeType.startsWith('text/') ||
                document.mimeType === 'application/json' ||
                document.mimeType === 'application/xml' ||
                document.mimeType.startsWith('application/javascript') ||
                document.mimeType.startsWith('text/x-') ||
                document.mimeType === 'application/octet-stream'
                ) {
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
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      }
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType) => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType === 'application/pdf') return '📄';
    if (mimeType.startsWith('text/')) return '📝';
    if (mimeType.startsWith('video/')) return '🎥';
    if (mimeType === 'application/json') return 'J';
    if (mimeType === 'application/xml') return 'X';
    if (mimeType.startsWith('audio/')) return '🎵';
    if (mimeType === 'application/msword' || mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return '📄';
    if (mimeType === 'application/vnd.ms-excel' || mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') return '📊';
    if (mimeType === 'application/vnd.ms-powerpoint' || mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') return '🎞️';
    return '📁';
  };

  return (
    <Layout>
      <Box sx={{ flexGrow: 1, p: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom color="primary.dark">
                  Document Management
                </Typography>
                <Box sx={{ mt: 2, mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
                  <Button
                    component="label"
                    variant="contained"
                    startIcon={<CloudUploadIcon />}
                    disabled={uploading}
                    size="large"
                  >
                    Upload File
                    <VisuallyHiddenInput
                      type="file"
                      onChange={handleFileUpload}
                      accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.bmp,.webp,image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,video/*,.mp4,.mov,.avi,.js,.html,.css,.py,.java,.json,.xml,.csv"
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
                          <SearchIcon color="action" />
                        </InputAdornment>
                      ),
                      style: { borderRadius: '8px' }
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
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Paper sx={{ borderRadius: '12px', overflow: 'hidden' }}>
              <TableContainer>
                <Table stickyHeader aria-label="document table">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'primary.light' }}>
                      <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>File Name</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', color: 'white' }}>Size</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', color: 'white' }}>Upload Date</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', color: 'white' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredFiles.length > 0 ? (
                      filteredFiles.map((file) => (
                        <TableRow
                          key={file._id}
                          sx={{ '&:nth-of-type(odd)': { backgroundColor: 'action.hover' } }}
                        >
                          <TableCell component="th" scope="row">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography component="span" variant="body1">
                                {getFileIcon(file.mimeType)}
                              </Typography>
                              <Typography variant="body2">{file.originalName}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="right">{formatFileSize(file.size)}</TableCell>
                          <TableCell align="right">
                            {new Date(file.createdAt).toLocaleString()}
                          </TableCell>
                          <TableCell align="right">
                            <Tooltip title="View Preview">
                              <IconButton
                                color="info"
                                onClick={() => handleViewAnalysis(file)}
                                size="small"
                              >
                                <VisibilityIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Download">
                              <IconButton
                                color="primary"
                                onClick={() => handleDownload(file._id)}
                                size="small"
                              >
                                <DownloadIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton
                                color="error"
                                onClick={() => handleDelete(file._id)}
                                size="small"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                          <Typography variant="h6" color="textSecondary">
                            {searchQuery ? 'No matching files found.' : 'No files uploaded yet. Start by uploading a document!'}
                          </Typography>
                          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                            Upload documents to manage, translate, and summarize them.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      <Dialog
        open={openDialog}
        onClose={() => { setOpenDialog(false); setSelectedDocument(null); }}
        maxWidth="md"
        fullWidth
        scroll="paper"
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          // ADD THIS LINE
          component="h2" // Explicitly set DialogTitle to render as h2
        >
          <Typography
            variant="h6"
            // ADD THIS LINE
            component="span" // Render this Typography as a span to avoid nesting h6 inside h2
          >
            File Preview: {selectedDocument?.originalName}
          </Typography>
          <IconButton onClick={() => { setOpenDialog(false); setSelectedDocument(null); }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedDocument && (
            <Box>
              {selectedDocument.mimeType.startsWith('image/') ? (
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <img
                    src={selectedDocument.url}
                    alt={selectedDocument.originalName}
                    style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px', border: '1px solid #eee' }}
                  />
                </Box>
              ) : selectedDocument.mimeType === 'application/pdf' ? (
                <iframe
                  src={selectedDocument.url}
                  width="100%"
                  height="600px"
                  title={selectedDocument.originalName}
                  style={{ border: 'none', borderRadius: '8px' }}
                />
              ) : selectedDocument.mimeType.startsWith('video/') ? (
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <video
                    controls
                    style={{ maxWidth: '100%', maxHeight: '600px', borderRadius: '8px' }}
                  >
                    <source src={selectedDocument.url} type={selectedDocument.mimeType} />
                    Your browser does not support the video tag.
                  </video>
                </Box>
              ) : selectedDocument.mimeType.startsWith('audio/') ? (
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <audio controls style={{ width: '100%', borderRadius: '8px' }}>
                    <source src={selectedDocument.url} type={selectedDocument.mimeType} />
                    Your browser does not support the audio element.
                  </audio>
                </Box>
              ) : selectedDocument.content ? (
                <Box sx={{
                  backgroundColor: '#f5f5f5',
                  padding: 2,
                  borderRadius: 1,
                  maxHeight: '500px',
                  overflowY: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  fontFamily: 'monospace',
                  border: '1px solid #e0e0e0',
                }}>
                  <Typography variant="body2" component="pre" sx={{ margin: 0 }}>
                    {selectedDocument.content}
                  </Typography>
                </Box>
              ) : (
                <Alert severity="info">
                  No direct preview available for this file type. You can download it to view.
                  <br />
                  File Type: {selectedDocument.mimeType}
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setOpenDialog(false); setSelectedDocument(null); }}>Close</Button>
          {selectedDocument && (
            <Button onClick={() => handleDownload(selectedDocument._id)} startIcon={<DownloadIcon />}>
              Download
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Layout>
  );
};

export default Dashboard;