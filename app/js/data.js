/* =====================================================================
   Progressão – Ramo Escoteiro 2026
   Conteúdo transcrito do documento "Progressão Ramo Escoteiro 2026".

   IMPORTANTE: os IDs dos itens são gerados pela POSIÇÃO de cada item.
   Para não perder dados salvos, só ACRESCENTE itens novos no FINAL das
   listas – nunca remova nem reordene itens existentes.
   ===================================================================== */

const ar  = (t) => ({ t, m: 'ar' });   // item da Modalidade do Ar  ✈
const mar = (t) => ({ t, m: 'mar' });  // item da Modalidade do Mar ⛵
const esp = (lista) => ({ t: 'Conquistar uma das seguintes especialidades (soma nas ações variáveis): ' + lista, esp: true });

export const ACOLHIDA = {
  id: 'ac',
  titulo: 'Período de Acolhida',
  subtitulo: 'Antigo "Período Introdutório"',
  itens: [
    'Participar ativamente das atividades com sua patrulha, com sua tropa e conhecer a sua estrutura.',
    'Utilizar o lenço escoteiro, saber o seu significado e conhecer a história do seu grupo escoteiro e do Escotismo.',
    'Reconhecer e responder aos apitos e sinais manuais próprios do ramo.',
    'Fazer parte de uma patrulha, participar do grito da patrulha, usar suas cores e símbolos, utilizar seu distintivo, saber quem é seu monitor e desempenhar um encargo na patrulha.',
    'Entender e usar o Lema do Escoteiro, o Sinal, a Saudação e o Aperto de Mão.',
    'Saber quais são e como conquistar os distintivos do Ramo Escoteiro e conhecer o uniforme ou vestuário escoteiro usado na sua tropa.',
    'Conhecer a Lei e Promessa Escoteira, sendo capaz de explicar para o seu monitor e escotista a sua importância e valores. Sentir-se pronto para assumir esse compromisso.',
  ],
};

const EIXOS_RAW = [
  {
    titulo: 'Habilidades para a Vida', icone: '🧭', cor: '#4f9dff',
    blocos: [
      {
        titulo: 'Aprendizagem contínua e desenvolvimento vocacional',
        descricao: 'Explorar assuntos que você acha interessantes e procurar informações confiáveis para experimentar novas ideias e recursos, colocando o que aprendeu em prática nas atividades e nos projetos de serviço à comunidade.',
        fixas: [
          'Conquistar, no Ramo Escoteiro, uma especialidade sobre um tema de seu interesse e que seja um conhecimento novo.',
          'Em conjunto com sua patrulha, realizar um Percurso de Gilwell de pelo menos 3 km.',
          ar('Visitar, com a patrulha ou tropa, um aeroporto ou aeroclube, identificando tipos de aeronaves e procedimentos de pouso e decolagem.'),
          mar('Visitar, com a patrulha ou tropa, um porto, marina ou iate clube, conhecendo seu funcionamento e os tipos de embarcações.'),
        ],
        req: 4,
        variaveis: [
          'Enviar e receber mensagens simples em Alfabeto Fonético, Código Internacional de Sinais, Semáfora, Heliografia, Cifra de César ou Criptografia.',
          'Visitar com sua patrulha: hospital, quartel de bombeiros, delegacia, empresas, comércios locais ou outros para conhecer o funcionamento de diferentes profissões.',
          'Conhecer o funcionamento de serviços de internet, rádio e TV e usar esses conhecimentos para resolver problemas técnicos.',
          'Convidar um especialista da comunidade para dialogar com a tropa e esclarecer dúvidas sobre determinado tema ou profissão.',
          'Utilizar corretamente um radiocomunicador em atividade de patrulha.',
          'Realizar uma pesquisa sobre um tema escolhido e apresentar os resultados para a patrulha ou tropa em formato criativo (cartaz, teatro, vídeo, oficina).',
          'Planejar e executar, em conjunto com a sua patrulha, uma ação de serviço comunitário baseada em informações pesquisadas sobre necessidades locais.',
          esp('Aeromodelismo, Arquitetura e Urbanismo, Astronáutica, Astronomia, Biblioteconomia, Cartografia, Comunicações, Confeitaria, Construção Civil, Criptografia, Culinária, Design de Interiores, E-Sports, Etiqueta, Ferramentas de Corte, Fiscalização de Pátio de Aeródromo, GPS, Informática, Investimentos, Jornalismo, Manicure, Manutenção Elétrica, Marcenaria, Marinharia, Matemática, Mecânica Aérea, Observação Aérea, Planador, Prevenção de Incêndio, Produção Gráfica, Programação, Química, Radioamadorismo, Radioescuta, Redes de Computadores, Segurança e Emergência Náutica, Segurança no Trânsito, Simulação Aérea, Sinalização, Técnica Aeronáutica, Vendas e Web Design.'),
          ar('Conhecer e demonstrar o funcionamento de um sistema de localização por satélite.'),
          ar('Apresentar a história e características de uma aeronave de sua escolha.'),
          mar('Realizar manutenção de uma embarcação, incluindo faxina, reparo, pintura ou substituição de peças.'),
          mar('Calcular um rumo magnético e corrigir a rota quando se aproxima de uma linha isogônica.'),
        ],
        ou: 'Conquistar uma das seguintes Insígnias: Insígnia do Aprender, Insígnia da Modalidade do Mar (Grumete) ou Insígnia da Modalidade do Ar (Aviador).',
      },
      {
        titulo: 'Autonomia e Liderança',
        descricao: 'Viver diferentes funções na patrulha, sabendo quando ajudar e quando é sua vez de liderar. Saber administrar o seu dinheiro para conseguir realizar atividades e projetos. Planejar, colocar em prática e depois avaliar as tarefas com o grupo, tomando decisões com responsabilidade.',
        fixas: [
          'Montar corretamente uma mochila para um acampamento, mantendo o equipamento pessoal em bom estado.',
          mar('Navegar em uma embarcação a vela ou remo, montando-a corretamente, identificando as partes (proa, popa, bombordo, boreste), usando o colete salva-vidas e respeitando as regras de segurança.'),
        ],
        req: 5,
        variaveis: [
          'Contribuir para o planejamento e a organização de uma excursão de patrulha.',
          'Fazer uma excursão urbana com a sua patrulha ou tropa, se locomovendo por meio de transportes públicos como ônibus, trens, metrô, entre outros.',
          'Pesquisar e realizar as compras dos alimentos para um acampamento, apresentando para a patrulha uma prestação de contas.',
          'Saber onde encontrar, identificando em um mapa, os principais serviços públicos na cidade.',
          'Planejar e executar em patrulha um projeto de captação de recursos para participação em uma atividade escoteira.',
          'Participar de atividades ou oficinas sobre finanças pessoais.',
          'Assumir pelo menos três encargos diferentes na patrulha, sendo bem avaliado pelos seus companheiros.',
          'Administrar o fundo de patrulha por pelo menos três meses, registrando receitas e despesas, e utilizar os recursos em atividades planejadas pela patrulha.',
          'Registrar receitas e despesas simples ou da mesada em planilha ou caderno por um período determinado.',
          'Conduzir uma reunião de patrulha como monitor ou secretário, registrando decisões e acompanhando sua execução.',
        ],
        ou: 'Conquistar ao menos uma das seguintes especialidades no nível 2: Administração, Educação Financeira, Empreendedorismo, Oratória e Reparos Domésticos.',
      },
      {
        titulo: 'Criatividade e Inovação',
        descricao: 'Usar a criatividade para resolver problemas do dia a dia, pensando em várias ideias diferentes antes de decidir qual é a melhor solução.',
        fixas: [
          'Animar um Fogo de Conselho em um acampamento da patrulha ou de tropa.',
          'Aplicar conceitos básicos de estruturas (cavaletes, encaixes, ancoragens) em projetos como pontes, balsas, pórticos ou outras pioneirias.',
          ar('Construir uma pipa, planador e foguete, testando aerodinâmica, planagem e propulsão.'),
          mar('Confeccionar e utilizar uma jangada, canoa ou bote para embarcar a sua patrulha, respeitando as regras de segurança.'),
        ],
        req: 4,
        variaveis: [
          'Organizar uma atividade de divulgação do escotismo no colégio, usando diferentes recursos: vídeos, cartazes, panfletos, entre outros.',
          'Conhecer e cantar canções e danças apropriadas para diferentes momentos.',
          'Criar uma campanha publicitária divertida promovendo algum projeto ou atividade da patrulha ou Tropa Escoteira.',
          'Construir equipamentos improvisados de campo (mesa, suporte, abrigo, utensílios) utilizando materiais disponíveis.',
          'Propor e implementar soluções criativas para reduzir custos de uma atividade, aproveitando materiais recicláveis ou doados.',
          'Ensinar e aplicar dois novos jogos para sua tropa.',
          'Criar alternativas criativas para decorar o canto da patrulha ou o acampamento.',
          'Participar de um festival de talentos na tropa.',
          'Improvisar apresentações artísticas (esquetes, músicas, danças) em um Fogo de Conselho, explorando recursos disponíveis.',
          'Criar um vídeo de divulgação das atividades de sua patrulha ou tropa.',
          ar('Demonstrar com um experimento simples os seguintes princípios: a) sustentação das asas, explicando quais as forças envolvidas e b) o funcionamento de um aeróstato e como sua altitude pode ser controlada.'),
          mar('Fazer um trabalho artesanal marinheiro com cabos, usando nós característicos da marinharia.'),
        ],
        ou: 'Conquistar ao menos uma das seguintes especialidades no nível 2: Arte Digital, Artes Visuais, Artesanato, Comédia, Costura e Estilismo, Encadernação, Fotografia, Grafite, HQ, Maquete, Pintura, Plastimodelismo, Propaganda e Marketing, Robótica e Videomaker.',
      },
      {
        titulo: 'Inteligência Emocional',
        descricao: 'Entender o que você sente, aprender a lidar com suas emoções de forma respeitosa e enfrentar desafios mesmo quando as coisas ficam difíceis.',
        fixas: [
          'Identificar situações perigosas e de maus tratos, sabendo como agir e a quem recorrer.',
        ],
        req: 4,
        variaveis: [
          'Conversar com a patrulha sobre pontos fortes e de melhoria no desempenho da equipe em atividades e acampamentos.',
          'Identificar seus medos e suas emoções diante de um obstáculo desafiador, trabalhando para conseguir superá-lo.',
          'Em um acampamento, participar de um turno de ronda com outro companheiro de patrulha, refletindo sobre o cuidado com o outro.',
          'Participar de jogos ou competições, respeitando regras e resultados.',
          'Em uma atividade de patrulha ou de tropa, aplicar técnicas de respiração, relaxamento ou meditação antes de um grande desafio.',
          'Participar de rodas de conversa ou momentos de partilha após atividades intensas, ouvindo e respeitando as emoções dos demais.',
          'Escrever uma pequena carta para si mesmo com palavras de incentivo, lembrando de suas qualidades e dando sugestões de como você pode superar desafios futuros.',
          'Criar e encenar uma pequena história em que o personagem passa por dificuldades e encontra formas saudáveis de lidar com elas.',
        ],
        ou: null,
      },
    ],
  },
  {
    titulo: 'Meio Ambiente', icone: '🌿', cor: '#3ecf8e',
    blocos: [
      {
        titulo: 'Consumo Responsável',
        descricao: 'Praticar o consumo consciente diariamente, evitando desperdícios e ajudando a preservar recursos naturais.',
        fixas: [
          'Em acampamentos e excursões, criar soluções para melhorar a higiene e conforto e classificar os resíduos em categorias, tratando-os adequadamente.',
          'Planejar adequadamente e adquirir as quantidades dos alimentos para refeições em um acampamento para sua patrulha, evitando desperdícios.',
        ],
        req: 5,
        variaveis: [
          'Registrar e analisar o consumo de água e energia da sua residência, buscando ideias para economizar e apresentar para sua patrulha os resultados.',
          'Avaliar o impacto ambiental de uma atividade e apresentar alternativas mais sustentáveis.',
          'Visitar uma estação de energia renovável, uma estação de tratamento de água, uma cooperativa ou usina de reciclagem ou outras opções semelhantes.',
          'Consertar objetos simples, como brinquedos ou pequenos eletrodomésticos.',
          'Utilizar embalagens retornáveis ou reutilizáveis nas refeições de campo, evitando descartáveis.',
          'Separar resíduos orgânicos e criar um sistema de compostagem caseira.',
          'Criar uma campanha educativa para a tropa sobre consumo consciente e economia de recursos.',
          'Trocar roupas, livros ou jogos com amigos e familiares em vez de comprar novos.',
          'Organizar, com sua patrulha, uma campanha de conscientização sobre consumo responsável.',
          'Confeccionar utensílios ou equipamentos a partir de materiais reciclados para uso nas atividades de patrulha.',
          'Planejar e realizar as refeições de um dia de acampamento sem carne, garantindo a ingestão adequada de proteínas.',
          'Organizar, cuidar e fazer reparos nos materiais de patrulha.',
          esp('Agricultura, Aquicultura e Energia.'),
        ],
        ou: 'Conquistar a especialidade de Horticultura (nível 2) ou a Insígnia Reduzir, Reciclar e Reutilizar.',
      },
      {
        titulo: 'Mudanças Climáticas',
        descricao: 'Participar de ações e projetos que ajudem a proteger o meio ambiente e enfrentar as mudanças do clima.',
        fixas: [],
        req: 5,
        variaveis: [
          'Em um acampamento, criar uma estação meteorológica simples para registrar temperatura, umidade, direção do vento, nuvens e possíveis mudanças climáticas.',
          'Participar da construção de um fogão solar e usá-lo em um acampamento de patrulha ou tropa.',
          'Participar de uma excursão urbana com foco ecológico, identificando situações de risco para a sociedade referentes às mudanças climáticas.',
          'Visitar ou participar de uma atividade com uma organização que atua em prol do meio ambiente.',
          'Em uma excursão ou acampamento em área não urbana, identificar ações prejudiciais à natureza, como extrativismo e mineração, e listar seus impactos.',
          'Planejar e participar de uma excursão utilizando meios de transporte que dependem de fontes de energia limpa (bicicleta, ônibus elétrico, embarcação a remo, entre outros).',
          'Organizar, com sua patrulha ou tropa, um projeto de conscientização sobre o uso de energia e água em sua escola, condomínio ou sede da UEL.',
          'Participar de mutirões de plantio de mudas ou cultivo de uma horta em casa, na escola ou na UEL.',
          esp('Agricultura, Energia, Jardinagem e Paisagismo.'),
        ],
        ou: 'Conquistar a especialidade de Meteorologia (nível 2) ou a Insígnia Escoteiros pela Energia Solar.',
      },
      {
        titulo: 'Preservação da Biodiversidade',
        descricao: 'Proteger os animais e as plantas, percebendo como nossas ações podem ajudar ou atrapalhar a natureza.',
        fixas: [
          'Participar, em patrulha, de uma atividade de exploração em ambiente natural, reconhecendo a fauna e a flora locais e identificando riscos à preservação, além de propor soluções para evitá-los.',
          ar('Identificar algumas aves, seus hábitos e compreender a relação das espécies com os métodos de voo e aerodinâmica.'),
          mar('Conhecer as características do bioma aquático local e os riscos para esse bioma.'),
        ],
        req: 5,
        variaveis: [
          'Reconhecer os animais venenosos e peçonhentos da região e saber como agir em casos de picadas ou contaminação.',
          'Planejar e executar um projeto ambiental com a patrulha ou tropa.',
          'Plantar uma espécie nativa e observar seu crescimento, registrando cada etapa.',
          'Identificar as pegadas de pelo menos cinco animais da fauna brasileira e realizar levantamento das pegadas em áreas naturais.',
          'Participar de uma atividade de mergulho que tenha o objetivo de conhecer e explorar a vida na água.',
          'Participar de uma atividade de observação de animais noturnos com sua patrulha.',
          'Observar e registrar espécies de aves, insetos, plantas ou outros animais durante um acampamento ou excursão.',
          'Visitar parques, reservas ou centros de proteção ambiental para conhecer ações de preservação da fauna e da flora.',
          'Construir comedouros ou bebedouros para aves e instalar em áreas adequadas, acompanhando seu uso.',
          'Criar materiais educativos, como vídeos ou posts, sobre a importância de preservar a biodiversidade.',
          esp('Animais Venenosos e Peçonhentos, Aquarismo, Biologia, Cuidados com Animais de Estimação, Entomologia, Geologia, Meliponicultura e Microbiologia.'),
        ],
        ou: 'Conquistar a especialidade (nível 2) de Botânica, Oceanologia ou Zoologia, ou a Insígnia Campeões da Natureza.',
      },
      {
        titulo: 'Vida ao Ar Livre',
        descricao: 'Aproveitar as atividades ao ar livre com respeito e cuidado, deixando cada lugar melhor do que encontrou.',
        fixas: [
          'Montar o campo de patrulha com pioneirias como mesa, pórtico e canto do lenhador, utilizando amarras adequadas.',
          'Aplicar os nós direito, correr, aselha, volta do fiel, escota durante um acampamento sabendo sua utilização.',
          'Escolher corretamente o local para montagem da barraca, incluindo técnicas de montagem, desmontagem e acondicionamento durante um acampamento de patrulha ou tropa.',
          'Manusear corretamente ferramentas de corte e sapa durante um acampamento de patrulha ou tropa, zelando pela segurança e realizando reparos.',
          'Preparar e executar uma fogueira para uma refeição mateira durante um acampamento de patrulha ou tropa, seguindo as técnicas de segurança.',
          'Participar de ao menos duas excursões ao ar livre (patrulha ou tropa), utilizando normas de baixo impacto ambiental.',
          'Participar de ao menos dois acampamentos ao ar livre (patrulha ou tropa), utilizando normas de baixo impacto ambiental.',
          'Orientar-se com recursos naturais, bússola e mapa, utilizando azimutes.',
          ar('Durante um acampamento, realizar observação das estrelas, identificando constelações e fases da lua, explicando suas interferências na natureza.'),
          mar('Durante uma atividade náutica, utilizar nós da modalidade do mar, como lais de guia, nó de cunho, pinha de retinida e nó de defensa.'),
        ],
        req: 5,
        variaveis: [
          'Participar de um percurso no campo de pelo menos 1 km utilizando sinais de pistas.',
          'Colaborar na preparação de alimentos para a patrulha em pelo menos três atividades ao ar livre, sendo uma delas no estilo comida mateira, sem utensílios.',
          'Desenvolver soluções para purificação e consumo de água em um acampamento.',
          'Aplicar técnicas de "tocaia" em jogos com a patrulha.',
          'Participar da construção de um fogão suspenso ou forno de acampamento para o preparo de uma refeição.',
          'Construir e pernoitar em um bivaque ou abrigo natural durante uma atividade de patrulha.',
          'Confeccionar falcaças, nó catau, lais de guia, pescador, oito duplo e demonstrar cuidados com as cordas.',
          'Participar de uma atividade aquática com a tropa, seguindo normas de segurança.',
          'Desenhar um croqui de um acampamento, usando sinais topográficos.',
          esp('Corrida de Orientação, Culinária Mateira, Escalada, Espeleoturismo, Ferramentas de Corte, Mountain Bike, Pesca e Rastreamento.'),
        ],
        ou: 'Conquistar ao menos uma das seguintes especialidades no nível 2: Acampamento, Excursões, Montanhismo, Pioneiria ou Sobrevivência.',
      },
    ],
  },
  {
    titulo: 'Paz e Desenvolvimento', icone: '🕊️', cor: '#f5b74f',
    blocos: [
      {
        titulo: 'Comunidade',
        descricao: 'Realizar boas ações diariamente e trabalhar em equipe para organizar atividades e projetos de serviço à comunidade.',
        fixas: [
          'Identificar, sozinho ou em patrulha, uma necessidade da comunidade e planejar e executar uma ação comunitária.',
          'Identificar os riscos de desastres naturais na comunidade e conhecer os hospitais e contatos de emergência, sabendo quando acionar cada um.',
        ],
        req: 3,
        variaveis: [
          'Aplicar o conhecimento adquirido nas especialidades em ações de serviço à comunidade.',
          'Participar ativamente de pelo menos uma campanha de serviço e desenvolvimento comunitário organizadas pela UEL, Distrito ou Região.',
          'Organizar uma oficina de brinquedos, doando os itens consertados para uma instituição que atende crianças carentes em situação de vulnerabilidade.',
          'Colaborar em ações organizadas por outras instituições de serviço.',
          'Conquistar a especialidade Inclusão ou Libras.',
        ],
        ou: 'Conquistar a especialidade (nível 2) Defesa Civil ou uma das Insígnias: Mensageiros da Paz ou Ação Comunitária.',
      },
      {
        titulo: 'Democracia',
        descricao: 'Participar das decisões da tropa, contribuindo com suas ideias, respeitando as opiniões dos colegas e se comprometendo a seguir o que foi decidido em conjunto.',
        fixas: [
          'Participar ativamente das decisões do Conselho de Patrulha, contribuindo com ideias, votando e assumindo responsabilidades, respeitando os resultados.',
          'Participar ativamente das decisões da Assembleia de Tropa, contribuindo com ideias, votando e assumindo responsabilidades, respeitando os resultados.',
          'Participar da eleição do monitor da patrulha e das decisões de encargos, respeitando os resultados.',
        ],
        req: 2,
        variaveis: [
          'Visitar a sede administrativa de qualquer um dos três poderes e explicar a importância e as particularidades desta forma de governo, conhecendo a constituição e os símbolos nacionais, do estado e município.',
          'Conhecer a estrutura do grupo escoteiro ou seção autônoma e participar de uma Assembleia de Grupo Escoteiro.',
          'Participar ativamente de um fórum de jovens do grupo escoteiro.',
          'Aprender e compartilhar sobre a história do voto e da democracia no Brasil.',
          esp('Geografia, Paz e Justiça, Prevenção de Fake News.'),
        ],
        ou: null,
      },
      {
        titulo: 'Herança Cultural',
        descricao: 'Conhecer e valorizar as histórias, os costumes e os lugares da sua comunidade e país e propor atividades para compartilhar esses conhecimentos com os outros.',
        fixas: [
          'Realizar o hasteamento ou arriamento da bandeira em cerimônias de abertura ou encerramento de atividade.',
        ],
        req: 5,
        variaveis: [
          'Desenvolver sua "Árvore Genealógica", pesquisando seu sobrenome, significado e a história dos seus antepassados, situando-os no contexto histórico e apresentá-la para sua patrulha.',
          'Participar das cerimônias com os símbolos nacionais e cantar o Hino Nacional corretamente.',
          'Apresentar para a sua patrulha ou tropa histórias de mulheres que se destacaram em nosso país.',
          'Participar, com sua patrulha, de uma comemoração ou festa típica da sua região.',
          'Participar, com sua patrulha, de um safári fotográfico em sua cidade, identificando os locais de importância histórica da localidade.',
          'Participar de um jantar festivo representando um estado diferente do seu.',
          'Aplicar jogos e atividades típicas da sua região.',
          'Visitar museus, centros culturais ou pontos históricos locais para conhecer o patrimônio da região.',
          'Investigar lendas, histórias ou personagens do folclore brasileiro e dramatizá-los em esquetes no Fogo de Conselho.',
          'Aplicar canções e danças típicas do Brasil.',
          'Confeccionar artesanato típico de alguma região do Brasil.',
          'Apresentar a cultura da sua cidade em um evento regional ou nacional, como feira das cidades ou noite folclórica.',
          esp('Anime, Arqueologia, Arte da Marinharia, Artes Cênicas, Capoeira, Civilizações da Antiguidade, Cosplay, Culinária Típica, Danças Folclóricas, História Aeroespacial, História da Aviação, História Brasileira, História da Arte, História do Escotismo, História Local, História Marítima, Literatura, Mitologias, Museologia, Origami, Paleontologia, Poesia.'),
        ],
        ou: 'Conquistar ao menos uma das seguintes especialidades no nível 2: Brasilidades, Genealogia, Informações Turísticas, Tradições dos Povos Originários.',
      },
      {
        titulo: 'Promoção da Paz',
        descricao: 'Conhecer e valorizar as histórias, os costumes e os lugares da sua comunidade e país e propor atividades para compartilhar esses conhecimentos com os outros.',
        fixas: [
          'Aplicar uma atividade para a patrulha sobre Direitos Humanos ou os Direitos da Criança e do Adolescente.',
        ],
        req: 4,
        variaveis: [
          'Convidar a patrulha a cooperar em ações organizadas por uma comunidade em favor de pessoas em situação de vulnerabilidade.',
          'Participar de uma excursão com sua patrulha ou tropa, visitando diferentes templos e conhecendo um pouco mais sobre cada religião.',
          'Participar de eventos de trocas culturais entre jovens de diferentes origens para estimular o respeito mútuo.',
          'Participar de uma atividade com outro grupo escoteiro ou seção autônoma e refletir sobre o que é a Fraternidade Mundial Escoteira.',
          'Conhecer as diferentes denominações de fé e crença de amigos da patrulha, tropa, escola e comunidade.',
          'Promover uma campanha que incentive atitudes de respeito e cooperação entre todos.',
          'Convidar representantes de diferentes crenças para compartilhar experiências e responder perguntas da tropa.',
          'Criar, com sua patrulha ou seção, um calendário de celebrações religiosas das diferentes denominações de fé e crença ali presentes.',
          esp('Geografia, História Mundial, Inclusão, Libras, Línguas, Paz e Justiça.'),
        ],
        ou: 'Conquistar uma das seguintes Insígnias: Insígnia da Lusofonia, Insígnia do Cone Sul, Diálogos pela Paz.',
      },
      {
        titulo: 'Valores',
        descricao: 'Colocar em prática a Promessa e a Lei Escoteira em tudo o que faz, demonstrando, com atitudes, que você vive os valores que acredita.',
        fixas: [
          'Avaliar, com seus companheiros de patrulha, a vivência da Promessa e Lei Escoteira.',
        ],
        req: 3,
        variaveis: [
          'Participar da avaliação da sua Progressão Pessoal e dos companheiros da patrulha.',
          'Explicar o significado da Lei e da Promessa Escoteira aos novos membros da patrulha.',
          'Auxiliar um companheiro de patrulha a realizar sua Promessa Escoteira.',
          'Explicar aos novos membros da patrulha os significados da Flor-de-lis e da Saudação Escoteira.',
          'Conhecer e cantar o Hino Alerta.',
          esp('Fogo de Conselho, História do Escotismo.'),
        ],
        ou: 'Conquistar a especialidade (nível 2) Escotismo Mundial.',
      },
    ],
  },
  {
    titulo: 'Saúde e Bem-estar', icone: '💪', cor: '#ef6b8a',
    blocos: [
      {
        titulo: 'Cuidado com o Corpo',
        descricao: 'Compreender as mudanças do seu corpo e respeitar as diferenças entre as pessoas, sem julgar pela aparência ou jeito de ser. Se cuidar, superar desafios físicos e aprender a ajudar em situações simples com primeiros socorros.',
        fixas: [
          'Conhecer as ações iniciais em acidentes e como cuidar de pequenos cortes, contusões, escoriações, queimaduras e picadas de animais peçonhentos.',
          'Aplicar técnicas de bandagens e transporte de feridos.',
          'Cuidar da segurança física e mental nas atividades escoteiras, respeitando os limites próprios e dos outros, e seguindo as orientações dos escotistas.',
        ],
        req: 4,
        variaveis: [
          'Conhecer as medidas do seu corpo (palmo, envergadura, passo simples e duplo) e aplicá-las durante uma excursão com sua patrulha.',
          'Participar de uma atividade, oficina, palestra que trate dos malefícios dos seguintes assuntos: anorexia, bulimia, drogas, álcool, cigarro e cigarros eletrônicos.',
          'Saber contato dos órgãos de emergência e saber como informar os sinais vitais e situação da vítima.',
          'Participar de uma simulação de acidente e atuar em conjunto com a sua patrulha.',
          'Proteger-se do sol e do frio durante as atividades identificando casos de desidratação e insolação e respeitar os limites do seu corpo.',
          'Demonstrar como ajudar uma pessoa em casos de obstrução das vias aéreas e convulsões.',
          'Conhecer os itens que compõem a caixa de primeiros socorros da patrulha e mantê-la organizada.',
          'Saber agir em casos de hemorragia.',
          esp('Babá, Cuidados com Idosos, Maquiagem, Salvamento, Segurança, Segurança e Emergência Náutica, Vigilância Epidemiológica.'),
          mar('Arremessar um cabo de retinida com pinha ou boia salva-vidas a 10 metros, utilizando a técnica de lançamento para salvamento, e conhecer as técnicas de natação para salvamento, transporte, reanimação e aquecimento de afogados.'),
        ],
        ou: 'Conquistar ao menos uma das seguintes especialidades no nível 2: Anatomia Humana, Prevenção em Saúde, Primeiros Socorros.',
      },
      {
        titulo: 'Espiritualidade',
        descricao: 'Explorar a espiritualidade ao se encantar com a natureza, ser solidário e conhecer diferentes crenças. Procurar viver com sentido e seguir seus princípios todos os dias.',
        fixas: [],
        req: 4,
        variaveis: [
          'Fazer reflexões espirituais rotineiras na tropa ou patrulha, ao ar livre.',
          'Apresentar um pequeno relato à patrulha ou tropa sobre os ensinamentos de sua crença ou religião.',
          'Auxiliar na realização de uma celebração de sua comunidade religiosa.',
          'Celebrar sua crença ou religião regularmente.',
          'Colaborar na organização de um culto interconfessional em uma atividade escoteira.',
          'Participar de um momento de reflexão e conexão com um ambiente natural em que possa apreciar e agradecer a beleza do mundo natural.',
        ],
        ou: 'Conquistar a especialidade Yoga (nível 2) ou a Insígnia Diálogo Inter-religioso.',
      },
      {
        titulo: 'Hábitos Saudáveis',
        descricao: 'Cuidar da saúde fazendo atividades físicas, comendo de maneira equilibrada, mantendo bons hábitos de higiene e deixando seu espaço sempre limpo e organizado.',
        fixas: [
          'Planejar e executar um cardápio completo e saudável (café da manhã, almoço e jantar) para a patrulha em acampamento.',
          'Conhecer e aplicar normas de limpeza no tratamento e conservação de alimentos nas atividades de patrulha.',
        ],
        req: 3,
        variaveis: [
          'Manter hábitos de higiene pessoal, utilizar o vestuário ou uniforme adequadamente, demonstrando aplicação correta dos distintivos.',
          'Contribuir para manter a sede do grupo e canto de patrulha em ordem e em perfeito estado de conservação.',
          'Montar um cronograma semanal, equilibrando estudos, responsabilidades e momentos de lazer.',
          'Praticar uma atividade física regularmente.',
          'Promover um piquenique com alimentos saudáveis com sua patrulha ou tropa.',
          'Manter adequada rotina de sono e alimentação saudável.',
          'Saber o que são as indicações de rótulos, o que são gorduras saturadas, conservantes, corantes, além dos selos de advertência.',
          'Arrumar e limpar seu quarto e contribuir nas rotinas da casa.',
          esp('Artes Marciais, Canoagem, Ciclismo, Corrida de Rua, Culinária Vegetariana, Cuidados Bucais, Dança, Desportos Inclusivos, Esportes de Quadra, Futebol, Ginásticas, Hipismo, Mergulho, Natação, Patinação, Plantas Medicinais, Remo, Skateboard, Slackline, Técnicas Verticais, Tênis, Tênis de Mesa, Tiro com Arco, Triatlo, Vela, Yoga.'),
        ],
        ou: 'Conquistar a especialidade (nível 2) Nutrição.',
      },
      {
        titulo: 'Saúde Mental',
        descricao: 'Adotar atitudes que ajudam a cuidar da sua saúde mental, encontrando formas de lidar com os desafios do dia a dia e colaborar para que todos se sintam bem ao seu redor.',
        fixas: [
          'Conhecer o conceito de Espaços Seguros e aplicá-lo em todas as atividades de sua patrulha ou tropa.',
          'Aprender a identificar sinais de tristeza ou isolamento em colegas e saber como oferecer apoio inicial, como conversar com respeito e buscar ajuda de um adulto de confiança.',
        ],
        req: 2,
        variaveis: [
          'Participar de uma atividade sobre a importância do autocuidado e da saúde mental.',
          'Conduzir uma sessão de relaxamento como yoga, meditação, caminhadas silenciosas na natureza, alongamentos, entre outras, para sua patrulha ou tropa.',
          'Organizar sua rotina de atividades semanais considerando a importância do equilíbrio entre as atividades do mundo digital e real e realizar uma atividade de bem-estar offline.',
          'Propor momentos de descontração com a família ao ar livre, evitando o uso da tecnologia e compartilhar como foi a experiência.',
          'Participar com sua patrulha de uma atividade que promova o contato com seus sentidos e promova momentos de equilíbrio emocional como por exemplo: uma trilha sensorial, pintura livre, roda de canções, observação de céu ou fogueira, entre outros.',
          esp('Aeromodelismo, Canto, Coleções, Cubo Mágico, Dança, Expressão Musical, Ioiô, Jogos de Cartas Colecionáveis, Jogos de Tabuleiro, Mágica e Ilusionismo, Maquiagem, Pipas, Quebra-Cabeças, RPG, Xadrez.'),
        ],
        ou: 'Conquistar a especialidade (nível 2) Prevenção aos Vícios.',
      },
      {
        titulo: 'Vínculos Saudáveis',
        descricao: 'Fazer amizades de um jeito saudável e respeitoso, tratando os outros com empatia, construindo relações positivas no dia a dia.',
        fixas: [
          'Realizar uma campanha para combater o bullying e cyberbullying para a comunidade.',
        ],
        req: 4,
        variaveis: [
          'Participar de jogos com a patrulha ou a tropa, respeitando as regras e seus participantes.',
          'Organizar uma atividade de patrulha em sua casa ou na casa de um membro da patrulha.',
          'Ensinar uma canção escoteira a outros escoteiros.',
          'Ajudar outro membro da UEL conquistar uma especialidade ou insígnia.',
          'Propor metas para melhorar a convivência na vida da patrulha e na tropa, compreendendo como todos se sentem quanto a isso.',
          'Participar de uma atividade entre diferentes grupos escoteiros ou atividade regional ou nacional.',
          'Acolher os novos integrantes da patrulha.',
          'Assumir tarefas domésticas para melhorar a convivência em casa.',
          'Participar de uma atividade da tropa com a família ou responsáveis.',
          'Convidar um colega da mesma faixa etária para participar de um Fogo de Conselho, integrado a sua patrulha e com o devido "Registro de Visitante".',
          ar('Participar de um torneio de aeromodelos.'),
        ],
        ou: 'Conquistar a especialidade (nível 2) Prevenção ao Bullying.',
      },
    ],
  },
];

const norm = (x) => (typeof x === 'string' ? { t: x } : x);

/** Estrutura final com IDs estáveis: e1b1f1, e1b1v3, e1b1ou ... */
export const EIXOS = EIXOS_RAW.map((e, ei) => {
  const eid = `e${ei + 1}`;
  return {
    id: eid, numero: ei + 1, titulo: e.titulo, icone: e.icone, cor: e.cor,
    blocos: e.blocos.map((b, bi) => {
      const bid = `${eid}b${bi + 1}`;
      return {
        id: bid, numero: bi + 1, titulo: b.titulo, descricao: b.descricao, req: b.req,
        fixas: b.fixas.map((x, i) => ({ id: `${bid}f${i + 1}`, ...norm(x) })),
        variaveis: b.variaveis.map((x, i) => ({ id: `${bid}v${i + 1}`, ...norm(x) })),
        ou: b.ou ? { id: `${bid}ou`, t: b.ou } : null,
      };
    }),
  };
});

export const ACOLHIDA_ITENS = ACOLHIDA.itens.map((t, i) => ({ id: `ac${i + 1}`, t }));

export const NUM_EXTENSO = { 1: 'uma', 2: 'duas', 3: 'três', 4: 'quatro', 5: 'cinco' };

/** O item vale para a modalidade da pessoa? (básica não vê itens Ar/Mar) */
export function itemVisivel(item, modalidade) {
  if (!item.m) return true;
  return item.m === modalidade;
}

/**
 * Calcula a situação de um bloco.
 * progresso: { [itemId]: { data } }
 */
export function statusBloco(bloco, progresso, modalidade) {
  const fixas = bloco.fixas.filter((i) => itemVisivel(i, modalidade));
  const vars = bloco.variaveis.filter((i) => itemVisivel(i, modalidade));
  const fixasOk = fixas.filter((i) => progresso[i.id]).length;
  const varsOk = vars.filter((i) => progresso[i.id]).length;
  const ouOk = bloco.ou ? !!progresso[bloco.ou.id] : false;
  const req = Math.min(bloco.req, vars.length);
  const completo = ouOk || (fixasOk === fixas.length && varsOk >= req);
  const total = fixas.length + req;
  const feito = fixasOk + Math.min(varsOk, req);
  const pct = completo ? 100 : total ? Math.round((feito / total) * 100) : 0;
  return { fixasOk, fixasTotal: fixas.length, varsOk, req, ouOk, completo, pct };
}

export function resumoGeral(progresso, modalidade) {
  const acOk = ACOLHIDA_ITENS.filter((i) => progresso[i.id]).length;
  let blocos = 0, completos = 0, somaPct = 0;
  const porEixo = EIXOS.map((e) => {
    let c = 0, s = 0;
    e.blocos.forEach((b) => {
      const st = statusBloco(b, progresso, modalidade);
      blocos++; s += st.pct; if (st.completo) { completos++; c++; }
    });
    somaPct += s;
    return { id: e.id, completos: c, total: e.blocos.length, pct: Math.round(s / e.blocos.length) };
  });
  const pct = Math.round((somaPct + (acOk / ACOLHIDA_ITENS.length) * 100) / (blocos + 1));
  return { acOk, acTotal: ACOLHIDA_ITENS.length, blocos, completos, pct, porEixo };
}

/* =====================================================================
   Especialidades e Insígnias (envio de relatório + avaliação do monitor)
   ===================================================================== */

/** Que tipo de envio um item exige: 'especialidade' | 'insignia' | 'ambos' | null */
export function tipoEnvio(item) {
  if (!item) return null;
  const t = item.t || '';
  const temIns = /ins[ií]gnia/i.test(t), temEsp = /especialidade/i.test(t);
  if (item.esp) return 'especialidade';
  if (item.id?.endsWith('ou') || /^Conquistar/i.test(t)) {
    if (temIns && temEsp) return 'ambos';
    if (temIns) return 'insignia';
    return 'especialidade';
  }
  return null;
}

/** Todos os itens da progressão que exigem envio, com o bloco a que pertencem. */
export const ITENS_COM_ENVIO = EIXOS.flatMap((e) => e.blocos.flatMap((b) =>
  [...b.fixas, ...b.variaveis, ...(b.ou ? [b.ou] : [])]
    .filter((i) => tipoEnvio(i))
    .map((i) => ({ ...i, tipo: tipoEnvio(i), bloco: `Eixo ${e.numero} · Bloco ${b.numero} – ${b.titulo}` }))));

export function itemPorId(id) {
  if (id?.startsWith('ac')) return ACOLHIDA_ITENS.find((i) => i.id === id);
  for (const e of EIXOS) for (const b of e.blocos) {
    const i = [...b.fixas, ...b.variaveis, ...(b.ou ? [b.ou] : [])].find((x) => x.id === id);
    if (i) return { ...i, bloco: `Eixo ${e.numero} · Bloco ${b.numero} – ${b.titulo}` };
  }
  return null;
}

const separaLista = (txt) => txt.replace(/\.$/, '').split(/,\s*|\s+e\s+|\s+ou\s+/).map((s) => s.trim()).filter(Boolean);

const ESP_EXTRAS = [
  'Administração', 'Educação Financeira', 'Empreendedorismo', 'Oratória', 'Reparos Domésticos', 'Arte Digital', 'Artes Visuais',
  'Artesanato', 'Comédia', 'Costura e Estilismo', 'Encadernação', 'Fotografia', 'Grafite', 'HQ', 'Maquete', 'Pintura',
  'Plastimodelismo', 'Propaganda e Marketing', 'Robótica', 'Videomaker', 'Horticultura', 'Meteorologia', 'Botânica',
  'Oceanologia', 'Zoologia', 'Acampamento', 'Excursões', 'Montanhismo', 'Pioneiria', 'Sobrevivência', 'Defesa Civil',
  'Inclusão', 'Libras', 'Brasilidades', 'Genealogia', 'Informações Turísticas', 'Tradições dos Povos Originários',
  'Escotismo Mundial', 'Anatomia Humana', 'Prevenção em Saúde', 'Primeiros Socorros', 'Yoga', 'Nutrição',
  'Prevenção aos Vícios', 'Prevenção ao Bullying',
];
const ESP_JUNTAS = ['Arquitetura e Urbanismo', 'Segurança e Emergência Náutica', 'Jardinagem e Paisagismo', 'Animais Venenosos e Peçonhentos',
  'Paz e Justiça', 'Mágica e Ilusionismo', 'Costura e Estilismo', 'Propaganda e Marketing', 'Vendas', 'Web Design', 'Agricultura', 'Aquicultura', 'Energia'];

/** Lista de especialidades citadas no documento (para sugestões no formulário). */
export const ESPECIALIDADES = (() => {
  const nomes = new Set(ESP_EXTRAS);
  ITENS_COM_ENVIO.filter((i) => i.esp).forEach((i) => {
    let txt = i.t.split(': ').slice(1).join(': ');
    ESP_JUNTAS.forEach((j) => { if (txt.includes(j)) { nomes.add(j); txt = txt.replace(j, ''); } });
    separaLista(txt).forEach((n) => { if (n.length > 1) nomes.add(n); });
  });
  return [...nomes].sort((a, b) => a.localeCompare(b, 'pt-BR'));
})();

export const INSIGNIAS = [
  'Insígnia do Aprender', 'Insígnia da Modalidade do Mar (Grumete)', 'Insígnia da Modalidade do Ar (Aviador)',
  'Insígnia Reduzir, Reciclar e Reutilizar', 'Insígnia Escoteiros pela Energia Solar', 'Insígnia Campeões da Natureza',
  'Insígnia Mensageiros da Paz', 'Insígnia Ação Comunitária', 'Insígnia da Lusofonia', 'Insígnia do Cone Sul',
  'Insígnia Diálogos pela Paz', 'Insígnia Diálogo Inter-religioso',
].sort((a, b) => a.localeCompare(b, 'pt-BR'));
