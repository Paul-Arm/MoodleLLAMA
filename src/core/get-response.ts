import type Config from '@typing/config';
import type GPTAnswer from '@typing/gpt-answer';
import normalizeText from '@utils/normalize-text';
import getContentWithHistory from './get-content-with-history';

/**
 * Get the response from the selected AI API
 * @param config
 * @param questionElement
 * @param question
 * @returns
 */
async function getAIResponse(
  config: Config,
  questionElement: HTMLElement,
  question: string
): Promise<GPTAnswer> {
  const controller = new AbortController();
  const timeoutController = setTimeout(() => controller.abort(), 20 * 1000);

  // Get the content to send to the AI API
  const contentHandler = await getContentWithHistory(config, questionElement, question);

  // Determine the API URL and headers based on the config
  let apiUrl: URL;
  let headers: Record<string, string>;
  let requestBody: Record<string, any>; 

  if (config.apiProvider === 'cloudflare') {
    // Cloudflare API proxy causes CORS issues...
    apiUrl  = new URL('https://worker-dry-flower-1c0c.paul-pa36.workers.dev/');
    apiUrl.searchParams.set('account_id', config.cloudflareAccountId || '');
    apiUrl.searchParams.set('auth_token', config.apiKey);
      headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`
      };
      requestBody = {
        messages: contentHandler.messages
      };
    } else {
      // Default to OpenAI
      apiUrl = new URL('https://api.openai.com/v1/chat/completions');
      headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`
      };
    requestBody = {
      model: config.model,
      messages: contentHandler.messages,
      temperature: 0.1, // Controls the randomness of the generated responses
      top_p: 0.6, // Determines the diversity of the generated responses
      presence_penalty: 0, // Encourages the model to introduce new concepts
      max_tokens: 2000 // Maximum length of the response
    };
  }

  const req = await fetch(apiUrl, {
    method: 'POST',
    headers: headers,
    signal: config.timeout ? controller.signal : null,
    body: JSON.stringify(requestBody)
  });

  clearTimeout(timeoutController);

  const rep = await req.json();
  const response =
    config.apiProvider === 'cloudflare' ? rep.result.response : rep.choices[0].message.content;

  // Save the response into the history
  if (typeof contentHandler.saveResponse === 'function') contentHandler.saveResponse(response);

  return {
    question,
    response,
    normalizedResponse: normalizeText(response)
  };
}

export default getAIResponse;
