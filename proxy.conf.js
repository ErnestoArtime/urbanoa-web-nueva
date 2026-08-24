const opsBackendUrl = process.env.URBANOA_OPS_BACKEND_URL || 'http://185.76.212.27';

module.exports = {
  '/external-content': {
    target: 'https://arinpark.gerteksa.eus',
    secure: true,
    changeOrigin: true,
    pathRewrite: {
      '^/external-content': '',
    },
  },
  '/ops-api': {
    target: opsBackendUrl,
    secure: false,
    changeOrigin: true,
    pathRewrite: {
      '^/ops-api/OPSWebServicesAPI': '/OPSWebServicesAPI3',
    },
  },
};
