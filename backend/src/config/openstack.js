const pkgcloud = require('pkgcloud');

const openstackConfig = {
  provider: 'openstack',
  username: process.env.OPENSTACK_USERNAME,
  password: process.env.OPENSTACK_PASSWORD,
  authUrl: process.env.OPENSTACK_AUTH_URL,
  region: process.env.OPENSTACK_REGION,
  tenantId: process.env.OPENSTACK_PROJECT_ID,
  container: process.env.OPENSTACK_CONTAINER
};

// Tạo client OpenStack
const client = pkgcloud.storage.createClient(openstackConfig);

module.exports = {
  client,
  config: openstackConfig
}; 