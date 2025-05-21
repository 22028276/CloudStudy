require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function testUpload() {
    try {
        // Lấy token
        const authResponse = await axios.post('http://192.168.19.128/identity/v3/auth/tokens', {
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

        const token = authResponse.headers['x-subject-token'];
        console.log('Authentication successful!');

        // Lấy Swift endpoint
        const catalogResponse = await axios.get('http://192.168.19.128/identity/v3/auth/catalog', {
            headers: {
                'X-Auth-Token': token
            }
        });

        const swiftService = catalogResponse.data.catalog.find(service => service.type === 'object-store');
        const swiftEndpoint = swiftService.endpoints.find(endpoint => endpoint.interface === 'public');
        console.log('Swift endpoint:', swiftEndpoint.url);

        // Tạo file test
        const testContent = 'This is a test file for Swift upload';
        const testFilePath = path.join(__dirname, 'test.txt');
        fs.writeFileSync(testFilePath, testContent);
        console.log('Created test file:', testFilePath);

        // Upload file
        const fileContent = fs.readFileSync(testFilePath);
        const uploadResponse = await axios.put(
            `${swiftEndpoint.url}/${process.env.OPENSTACK_CONTAINER}/test.txt`,
            fileContent,
            {
                headers: {
                    'X-Auth-Token': token,
                    'Content-Type': 'text/plain'
                }
            }
        );

        console.log('File uploaded successfully!');
        console.log('Upload response:', uploadResponse.status);

        // Liệt kê objects trong container
        const listResponse = await axios.get(`${swiftEndpoint.url}/${process.env.OPENSTACK_CONTAINER}`, {
            headers: {
                'X-Auth-Token': token
            }
        });

        console.log('Container contents:', listResponse.data);

        // Xóa file test
        fs.unlinkSync(testFilePath);
        console.log('Test file deleted');

    } catch (error) {
        if (error.response) {
            console.error('Error response:', {
                status: error.response.status,
                data: error.response.data,
                headers: error.response.headers
            });
        } else {
            console.error('Error:', error.message);
        }
    }
}

testUpload(); 