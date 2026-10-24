# Remix of Meal Miles Magic

Analise os vídeos as fotos e Crie "Foodie", um app web mobile-first (React + TypeScript + Tailwind + Supabase) de delivery de comida, em português do Brasil.

DESIGN
- Paleta verde: primário #8CB04F, escuro #4F6F2A, fundo off-white #F4F5EF, cards brancos com cantos 16-24px, sombras suaves.
- Headers com gradiente verde e cantos inferiores arredondados. Fonte sans moderna, botões em pílula com gradiente verde.
- Bottom nav fixa: Início, Salvos, Cesta (com badge), Ofertas, Perfil.
- Animações suaves (fade/slide) entre telas e em bottom sheets.

TELAS
1. Splash: ilustração de entregador de moto, logo "Foodie." e slogan "Comida deliciosa, entregue rápido".
2. Login/Cadastro: header verde com ilustração, e-mail/telefone + senha, "manter conectado", "esqueci a senha", login Google e Apple (Supabase Auth).
3. Home: endereço atual no topo (com seletor), busca, banner "Entrega rápida e grátis", categorias (Todos, Burger, Pizza, Sushi, Frango) com filtro, "Peça de novo", "Ofertas para você" (cupons), "Restaurantes perto de você" em grid com selo de desconto, nota, tempo e distância.
4. Restaurante: capa, nome, nota, taxa, chips (Pedido em grupo, Agendar), cupom resgatável, seção "Para você" com itens, preço, kcal e botão +.
5. Detalhe do item (bottom sheet): foto, descrição, tamanho (radio: Regular/Grande/Combo com acréscimo), adicionais opcionais, stepper de quantidade e botão "Adicionar à cesta · R$".
6. Checkout: abas Entrega/Retirada, mini mapa com endereço, itens editáveis, cupom, forma de pagamento, subtotal, taxa, total fixo no rodapé com "Fazer pedido".
7. Confirmar local: mapa em tela cheia (Leaflet + OpenStreetMap) com pin, busca de endereço, card com endereço e botão "Confirmar local".
8. Rastreamento ao vivo: mapa com rota (polyline verde), moto animada suavemente pelo trajeto, bottom sheet com ETA, barra de 5 etapas (Confirmado, Preparando, Coletado, A caminho, Entregue), dados do entregador (foto, nota, placa) com botões chat e ligar, e timeline do status.

BACKEND (Supabase, com RLS em todas as tabelas)
- Tabelas: profiles, addresses, restaurants, categories, menu_items, item_options, coupons, orders, order_items, order_status_events, couriers, favorites.
- Realtime: status do pedido e posição do entregador (lat/lng) via Supabase Realtime, refletindo na UI sem recarregar.
- Edge Function que simula a evolução do status e o deslocamento do entregador para demonstração.
- Cada usuário acessa só seus pedidos, endereços e favoritos.
- Seed com 4+ restaurantes e 4+ itens cada.

REGRAS
- Estado da cesta persistente, cálculo de subtotal/taxa/cupom correto.
- Estados de loading (skeleton), vazio e erro em todas as telas.
- Código organizado em componentes reutilizáveis (RestaurantCard, MenuItemCard, BottomSheet, OrderStepper, TrackingMap).

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/b6b5a728-5a57-4671-9496-546f377a2e97).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
