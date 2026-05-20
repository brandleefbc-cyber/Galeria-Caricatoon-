# Galeria do Grotesco — Gerador de Caricaturas

Site simples para enviar fotos e gerar caricaturas no estilo grotesco/esboço de caderno.

## Arquivos

- `index.html`: página principal do site.
- `netlify/functions/generate-caricature.js`: função segura que chama a API de imagem.
- `netlify.toml`: configuração para publicar no Netlify.

## Como publicar no Netlify

1. Crie uma conta ou entre no Netlify.
2. Crie um novo site e envie esta pasta/ZIP.
3. No painel do site, vá em **Site configuration** > **Environment variables**.
4. Crie a variável:
   - `OPENAI_API_KEY` = sua chave da API
5. Opcional: crie a variável:
   - `OPENAI_IMAGE_MODEL` = `gpt-image-2`
6. Faça o deploy novamente.
7. Abra o link público gerado pela Netlify.

## Observações importantes

- Não coloque a chave da API diretamente no `index.html`.
- Cada caricatura gerada consome créditos da API configurada.
- O resultado depende da qualidade da foto original e do modelo usado.
- O limite configurado no site é 8 MB por imagem.
