export function formatFeishuCallbackResponse(result) {
  if (!result) {
    return {};
  }

  const response = {};

  if (result.toast) {
    response.toast = result.toast;
  }

  if (result.card) {
    if (result.card.type && result.card.data) {
      response.card = result.card;
    } else {
      response.card = {
        type: "raw",
        data: result.card
      };
    }
  }

  return response;
}
