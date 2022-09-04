
// Environment specific configuration injected into the container
module.exports = {
    rabbitmqUrl: process.env.RABBITMQ_URL,
    searchServiceURL:  process.env.SEARCH_SERVICE_URL,
};