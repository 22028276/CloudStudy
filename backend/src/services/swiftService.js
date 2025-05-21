const axios = require('axios');
const fs = require('fs');
const path = require('path');

class SwiftService {
    constructor() {
        this.authUrl = process.env.OPENSTACK_AUTH_URL;
        this.container = process.env.OPENSTACK_CONTAINER;
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
            throw error;
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
            this.swiftEndpoint = swiftService.endpoints.find(endpoint => endpoint.interface === 'public');
            return this.swiftEndpoint.url;
        } catch (error) {
            console.error('Get Swift endpoint error:', error.message);
            throw error;
        }
    }

    async uploadFile(fileBuffer, fileName, contentType) {
        try {
            if (!this.swiftEndpoint) {
                await this.getSwiftEndpoint();
            }

            const uploadResponse = await axios.put(
                `${this.swiftEndpoint.url}/${this.container}/${fileName}`,
                fileBuffer,
                {
                    headers: {
                        'X-Auth-Token': this.token,
                        'Content-Type': contentType || 'application/octet-stream'
                    }
                }
            );

            return {
                success: true,
                status: uploadResponse.status,
                url: `${this.swiftEndpoint.url}/${this.container}/${fileName}`
            };
        } catch (error) {
            console.error('Upload file error:', error.message);
            throw error;
        }
    }

    async listFiles() {
        try {
            if (!this.swiftEndpoint) {
                await this.getSwiftEndpoint();
            }

            const listResponse = await axios.get(`${this.swiftEndpoint.url}/${this.container}`, {
                headers: {
                    'X-Auth-Token': this.token
                }
            });

            return listResponse.data;
        } catch (error) {
            console.error('List files error:', error.message);
            throw error;
        }
    }

    async downloadFile(fileName) {
        try {
            if (!this.swiftEndpoint) {
                await this.getSwiftEndpoint();
            }

            const response = await axios.get(
                `${this.swiftEndpoint.url}/${this.container}/${fileName}`,
                {
                    headers: {
                        'X-Auth-Token': this.token
                    },
                    responseType: 'arraybuffer'
                }
            );

            return response.data;
        } catch (error) {
            console.error('Download file error:', error.message);
            throw error;
        }
    }

    async deleteFile(fileName) {
        try {
            if (!this.swiftEndpoint) {
                await this.getSwiftEndpoint();
            }

            const response = await axios.delete(
                `${this.swiftEndpoint.url}/${this.container}/${fileName}`,
                {
                    headers: {
                        'X-Auth-Token': this.token
                    }
                }
            );

            return {
                success: true,
                status: response.status
            };
        } catch (error) {
            console.error('Delete file error:', error.message);
            throw error;
        }
    }
}

module.exports = new SwiftService(); 