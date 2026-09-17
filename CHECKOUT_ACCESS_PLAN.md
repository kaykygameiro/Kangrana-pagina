# Fluxo de acesso após a compra

A landing page e o aplicativo Kangrana são projetos separados. Esta página estática encaminha para `CHECKOUT_URL` e não valida pagamentos, cria contas ou altera dados do aplicativo. A oferta definida é R$ 29,90 em pagamento único, sem promessa de acesso vitalício.

O texto público informa que, após a confirmação do pagamento, o comprador recebe por e-mail as instruções de acesso. O fluxo de compra externo deve cumprir essa informação e incluir um canal de suporte capaz de receber pedidos de exclusão descritos em `exclusao.html`.

## Integração do serviço de compra com o aplicativo

1. Receber a compra aprovada por webhook da Kiwify ou Hotmart em um servidor ou Edge Function, seguindo a documentação da plataforma.
2. Verificar a autenticidade do webhook e os dados de produto, compra e status. Segredos ficam apenas no servidor.
3. Registrar autorização de acesso vinculada à compra e à conta correta.
4. Criar, convidar ou associar a conta do comprador com confirmação de identidade.
5. Proteger recursos pagos no backend ou por RLS; URL de sucesso, query string e botão oculto não comprovam pagamento.
6. Tratar reembolso, cancelamento e chargeback com atualização ou revogação da autorização.
7. Tornar o processamento idempotente para eventos repetidos ou fora de ordem.
8. Registrar logs técnicos sem senha, token, dados financeiros ou payload sensível completo.
9. Enviar e-mail real com instruções de primeiro acesso e canal de suporte que aceite respostas ou informe um contato funcional.
10. Testar conta sem compra, compra aprovada, evento duplicado, reembolso, forja de URL e acesso direto às APIs protegidas.

Esse fluxo pertence ao projeto externo do aplicativo e da plataforma de pagamento. A landing não contém qualquer chave ou dependência do Supabase.
