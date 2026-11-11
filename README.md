# Na'Guará – Portfólio PWA com avaliações

Portfólio mobile first sobre arepa, tequeño e chicha, instalável (PWA) e com avaliação de 1 a 5 estrelas feita pelos clientes.

- `public/` → site (HTML, CSS, JS, manifest.json, sw.js)
- `server.js` → servidor Express: serve o site e guarda as notas em `/api/ratings`

## Testar localmente
    npm install
    npm start
Abra http://localhost:3000

## Publicar no Render via GitHub
1. Envie o projeto ao GitHub (git init, add, commit, push).
2. No Render: New + > **Web Service** > conecte o repositório.
3. Runtime: Node · Build Command: `npm install` · Start Command: `npm start`.
4. Create Web Service.

## Atenção: onde as notas ficam salvas
As notas ficam no arquivo `data/ratings.json`. No plano gratuito do Render o disco é temporário: as notas podem ser apagadas a cada novo deploy ou reinício. Para guardar de forma permanente, adicione um Disk no Render (plano pago), monte em `/var/data` e crie a variável de ambiente `DATA_DIR=/var/data`.
Cada aparelho só vota uma vez por prato (controle no navegador) e o servidor limita 10 votos por minuto por IP.
