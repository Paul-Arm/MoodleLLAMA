import type Config from '@typing/config';
import type GPTAnswer from '@typing/gpt-answer';
import normalizeText from '@utils/normalize-text';
import getContentWithHistory from './get-content-with-history';

/**
 * Get the response from chatGPT api
 * @param config
 * @param question
 * @returns
 */
async function getChatGPTResponse(
  config: Config,
  questionElement: HTMLElement,
  question: string
): Promise<GPTAnswer> {
  const controller = new AbortController();
  const timeoutControler = setTimeout(() => controller.abort(), 20 * 1000);

  // Get the content to send to chatgpt
  // Including the instructions to the AI, the images as base64 if needed, the question and the past conversation if history is set to true
  const contentHandler = await getContentWithHistory(config, questionElement, question);

  const req = await fetch(`https://api.cloudflare.com/client/v4/accounts/${config.accountId}/ai/run/@cf/meta/${config.scriptName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`
    },
    signal: config.timeout ? controller.signal : null,
    body: JSON.stringify({
      messages: contentHandler.messages
    })
  });

  clearTimeout(timeoutControler);

  const rep = await req.json();
  const response = rep.choices[0].message.content;

  // Save the response into the history
  if (typeof contentHandler.saveResponse === 'function') contentHandler.saveResponse(response);

  return {
    question,
    response,
    normalizedResponse: normalizeText(response)
  };
}

export default getChatGPTResponse;
