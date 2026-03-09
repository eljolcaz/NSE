import serverless from 'serverless-http';

let serverlessHandler: any;

export const handler = async (event: any, context: any) => {
  if (!serverlessHandler) {
    process.env.IS_SERVERLESS = 'true';
    const { app } = await import('../../server');
    serverlessHandler = serverless(app);
  }
  return serverlessHandler(event, context);
};
