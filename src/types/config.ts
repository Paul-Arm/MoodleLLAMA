type Config = {
  apiKey: string;
  cloudflareAccountId?: string;
  model: string;
  code?: string;
  infinite?: boolean;
  typing?: boolean;
  mouseover?: boolean;
  cursor?: boolean;
  logs?: boolean;
  title?: boolean;
  timeout?: boolean;
  history?: boolean;
  includeImages?: boolean;
  apiProvider?: 'openai' | 'cloudflare';

  mode?: 'autocomplete' | 'question-to-answer' | 'clipboard';
};

export default Config;
