require('dotenv').config();
const axios = require('axios');

async function testOpenStackConnection() {
    try {
        // Kiểm tra kết nối
        console.log('Testing OpenStack connection...');
        const authUrl = 'http://192.168.19.128/identity';
        console.log('Auth URL:', authUrl);
        console.log('Username:', process.env.OPENSTACK_USERNAME);
        console.log('Project ID:', process.env.OPENSTACK_PROJECT_ID);

        // Lấy token
        const authResponse = await axios.post(authUrl + '/v3/auth/tokens', {
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
                        name: 'admin',  // Sử dụng tên project thay vì ID
                        domain: {
                            name: 'Default'
                        }
                    }
                }
            }
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const token = authResponse.headers['x-subject-token'];
        console.log('Authentication successful!');
        console.log('Token:', token);

        // Lấy catalog để tìm Swift endpoint
        const catalogResponse = await axios.get(authUrl + '/v3/auth/catalog', {
            headers: {
                'X-Auth-Token': token
            }
        });

        console.log('Catalog response:', JSON.stringify(catalogResponse.data, null, 2));

        // Tìm Swift endpoint trong catalog
        let swiftEndpoint = null;
        if (catalogResponse.data && catalogResponse.data.catalog) {
            const swiftService = catalogResponse.data.catalog.find(service => service.type === 'object-store');
            if (swiftService && Array.isArray(swiftService.endpoints)) {
                swiftEndpoint = swiftService.endpoints.find(endpoint => endpoint.interface === 'public');
            }
        }

        if (!swiftEndpoint) {
            console.log('Swift service not found in catalog. Please install Swift service.');
            return;
        }

        console.log('Found Swift endpoint:', swiftEndpoint.url);

        // Liệt kê containers
        const containersResponse = await axios.get(swiftEndpoint.url, {
            headers: {
                'X-Auth-Token': token
            }
        });

        const containers = containersResponse.data;
        console.log('Available containers:', containers);

        // Kiểm tra container cloudstudy-files
        const container = containers.find(c => c.name === process.env.OPENSTACK_CONTAINER);
        if (!container) {
            console.log('Creating cloudstudy-files container...');
            await axios.put(swiftEndpoint.url + '/v1/AUTH_' + process.env.OPENSTACK_PROJECT_ID + '/' + process.env.OPENSTACK_CONTAINER, null, {
                headers: {
                    'X-Auth-Token': token
                }
            });
            console.log('Container created successfully!');
        } else {
            console.log('Container cloudstudy-files already exists');
        }

    } catch (error) {
        if (error.response) {
            console.error('Error response:', {
                status: error.response.status,
                data: error.response.data,
                headers: error.response.headers
            });
            console.error('Request URL:', error.config.url);
            console.error('Request data:', JSON.stringify(error.config.data, null, 2));
        } else {
            console.error('Error:', error.message);
        }
    }
}

testOpenStackConnection(); 