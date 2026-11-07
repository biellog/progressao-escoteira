/* =====================================================================
   CONFIGURAÇÃO DO APLICATIVO
   ---------------------------------------------------------------------
   • Sem Supabase (campos vazios) → MODO LOCAL: os dados ficam salvos no
     próprio aparelho/navegador. Bom para testar.
   • Com Supabase preenchido → MODO NUVEM: todos os escoteiros, monitores
     e chefes compartilham o mesmo banco de dados (recomendado).
     Veja o passo a passo no README.md.
   ===================================================================== */
export const CONFIG = {
  NOME_APP: 'Progressão Escoteira',

  // Supabase (https://supabase.com) – Project Settings → API
  SUPABASE_URL: '',
  SUPABASE_ANON_KEY: '',

  // Usado SOMENTE no modo local. No modo nuvem, os chefes autorizados e os
  // seus códigos ficam protegidos na tabela "chefes_autorizados" do banco.
  CHEFES_LOCAIS: [
    { email: 'chefe@gmail.com', codigo: 'CHEFE-2026' },
  ],

  // De quanto em quanto tempo o app procura atualizações (minutos)
  INTERVALO_ATUALIZACAO_MIN: 30,
};
