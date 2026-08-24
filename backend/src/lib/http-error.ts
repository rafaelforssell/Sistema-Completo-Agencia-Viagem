export class HttpError extends Error {
  status: number;
  detalhes?: unknown;

  constructor(status: number, mensagem: string, detalhes?: unknown) {
    super(mensagem);
    this.name = "HttpError";
    this.status = status;
    this.detalhes = detalhes;
  }

  static badRequest(mensagem: string, detalhes?: unknown) {
    return new HttpError(400, mensagem, detalhes);
  }
  static unauthorized(mensagem = "Não autenticado.") {
    return new HttpError(401, mensagem);
  }
  static forbidden(mensagem = "Acesso negado.") {
    return new HttpError(403, mensagem);
  }
  static notFound(mensagem = "Recurso não encontrado.") {
    return new HttpError(404, mensagem);
  }
  static conflict(mensagem: string) {
    return new HttpError(409, mensagem);
  }
}
