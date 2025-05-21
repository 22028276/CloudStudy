const axios = require('axios');
const fs = require('fs');
const path = require('path');

class OpenStackService {
    constructor() {
        this.authUrl = process.env.OPENSTACK_AUTH_URL;
        this.token = null;
        this.swiftEndpoint = null;
    }

    async authenticate() {
        try {
            const authResponse = await axios.post(this.authUrl + '/v3/auth/tokens', {
                auth: {
                    identity: {
                        methods: ['password'],
                        password: {
                            user: {
                                name: process.env.OPENSTACK_USERNAME,
                                password: process.env.OPENSTACK_PASSWORD,
                                domain: {
                                    name: 'Default'
                                }
                            }
                        }
                    },
                    scope: {
                        project: {
                            name: 'admin',
                            domain: {
                                name: 'Default'
                            }
                        }
                    }
                }
            });

            this.token = authResponse.headers['x-subject-token'];
            return this.token;
        } catch (error) {
            console.error('Authentication error:', error.message);
            throw new Error(`OpenStack authentication failed: ${error.message}`);
        }
    }

    async getSwiftEndpoint() {
        try {
            if (!this.token) {
                await this.authenticate();
            }

            const catalogResponse = await axios.get(this.authUrl + '/v3/auth/catalog', {
                headers: {
                    'X-Auth-Token': this.token
                }
            });

            const swiftService = catalogResponse.data.catalog.find(service => service.type === 'object-store');
            if (!swiftService) {
                throw new Error('Swift service not found in service catalog');
            }

            this.swiftEndpoint = swiftService.endpoints.find(endpoint => endpoint.interface === 'public');
            if (!this.swiftEndpoint) {
                throw new Error('Public Swift endpoint not found');
            }

            return this.swiftEndpoint.url;
        } catch (error) {
            console.error('Get Swift endpoint error:', error.message);
            throw new Error(`Failed to get Swift endpoint: ${error.message}`);
        }
    }

    async uploadFile(file, userId) {
        try {
            if (!this.swiftEndpoint) {
                await this.getSwiftEndpoint();
            }

            const containerName = `user-${userId}`;
            const fileName = `${Date.now()}-${file.originalname}`;

            // Create container if it doesn't exist
            try {
                await axios.put(
                    `${this.swiftEndpoint.url}/${containerName}`,
                    null,
                    {
                        headers: {
                            'X-Auth-Token': this.token
                        }
                    }
                );
            } catch (error) {
                if (error.response?.status !== 202) {
                    throw error;
                }
            }

            // Upload file
            const uploadResponse = await axios.put(
                `${this.swiftEndpoint.url}/${containerName}/${fileName}`,
                file.buffer,
                {
                    headers: {
                        'X-Auth-Token': this.token,
                        'Content-Type': file.mimetype
                    }
                }
            );

            return {
                fileName: fileName,
                containerName: containerName
            };
        } catch (error) {
            console.error('Upload file error:', error.message);
            throw new Error(`Failed to upload file to OpenStack: ${error.message}`);
        }
    }

    async deleteFile(containerName, fileName) {
        try {
            if (!this.swiftEndpoint) {
                await this.getSwiftEndpoint();
            }

            const fileUrl = `${this.swiftEndpoint.url}/${containerName}/${fileName}`;
            
            // Kiểm tra xem file có tồn tại không
            try {
                await axios.head(fileUrl, {
                    headers: {
                        'X-Auth-Token': this.token
                    }
                });
            } catch (headError) {
                console.log('File not found in OpenStack, skipping deletion');
                return true;
            }

            // Xóa file
            await axios.delete(fileUrl, {
                headers: {
                    'X-Auth-Token': this.token
                }
            });

            return true;
        } catch (error) {
            console.error('Delete file error:', error.message);
            if (error.response?.status === 404) {
                console.log('File already deleted or not found');
                return true;
            }
            throw new Error(`Failed to delete file from OpenStack: ${error.message}`);
        }
    }

    async getFileUrl(containerName, fileName) {
        try {
            if (!this.swiftEndpoint) {
                await this.getSwiftEndpoint();
            }

            const fileUrl = `${this.swiftEndpoint.url}/${containerName}/${fileName}`;

            // Kiểm tra xem file có tồn tại không
            try {
                const headResponse = await axios.head(fileUrl, {
                    headers: {
                        'X-Auth-Token': this.token
                    }
                });

                // Tạo URL có token xác thực
                return {
                    url: fileUrl,
                    headers: {
                        'X-Auth-Token': this.token
                    }
                };
            } catch (headError) {
                console.error('File not found:', headError.message);
                throw new Error('File not found in OpenStack');
            }
        } catch (error) {
            console.error('Get file URL error:', error.message);
            throw new Error(`Failed to get file URL: ${error.message}`);
        }
    }

    async getFileStream(containerName, fileName) {
        try {
            if (!this.swiftEndpoint) {
                await this.getSwiftEndpoint();
            }

            const fileUrl = `${this.swiftEndpoint.url}/${containerName}/${fileName}`;

            // Kiểm tra xem file có tồn tại không
            try {
                await axios.head(fileUrl, {
                    headers: {
                        'X-Auth-Token': this.token
                    }
                });
            } catch (headError) {
                console.error('File not found:', headError.message);
                throw new Error('File not found in OpenStack');
            }

            // Lấy file stream
            const response = await axios.get(fileUrl, {
                headers: {
                    'X-Auth-Token': this.token
                },
                responseType: 'stream'
            });

            return response.data;
        } catch (error) {
            console.error('Get file stream error:', error.message);
            throw new Error(`Failed to get file stream: ${error.message}`);
        }
    }
}

module.exports = new OpenStackService(); 