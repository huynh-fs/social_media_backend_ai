import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Social Media App API',
      version: '1.0.0',
      description: 'API documentation for the Social Media App, built with Node.js, Express, and MongoDB.',
      contact: {
        name: 'HuyNH',
        email: 'huynh@runsystem.net',
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 5000}/api`,
        description: 'Development server',
      },
      // Bạn có thể thêm các server khác như staging hoặc production ở đây
    ],
    // ✨ Quan trọng: Thêm định nghĩa bảo mật cho JWT
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  // ✨ Chỉ định các file mà swagger-jsdoc sẽ quét
  apis: ['./src/routes/*.ts', './src/models/*.ts'], // Quét tất cả các file route và model
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;