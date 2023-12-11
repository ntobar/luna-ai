const winston = require('winston');
const Transport = require('winston-transport');
const axios = require('axios');

class DatadogTransport extends Transport {
  constructor(opts) {
    super(opts);
    this.http = axios.create({
      baseURL: 'https://http-intake.logs.datadoghq.com',
      timeout: 1000,
      headers: { 'Content-Type': 'application/json' },
    });
    this.apiKey = opts.apiKey;
  }

  log(info, callback) {
    setImmediate(() => {
      this.emit('logged', info);
    });

    // Extract the metadata from the info object
    const metadata = info.metadata || {};


    // Perform the writing to the remote service
    this.http.post(`/v1/input/${this.apiKey}`, {
      message: info.message,
      ddsource: 'nodejs',
      ddtags: 'env:production,version:1.0.0',
      hostname: 'luna-droplet',
      service: 'luna-chatbot',
      ...metadata,
    })
    .then((response) => {
      callback();
    })
    .catch((error) => {
      console.error('Error sending log to Datadog', error);
    });
  }
}

export const Logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new DatadogTransport({ apiKey: '8fa43cabf68b63ea8789f397dde012f1' }),
  ],
});
