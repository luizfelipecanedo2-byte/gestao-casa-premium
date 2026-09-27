// AI Assistant for Felipe & Mara Home Finance
export interface ParsedTransaction {
  title: string
  amount: number
  type: 'payable' | 'receivable'
  category: string
  sub_category: string
  bank: string
  payment_method: string
  date: string
  notes: string
  status?: 'pending' | 'completed'
}

const CATEGORIES = [
  'RECEITA SALÁRIO',
  'RECEITA EXTRA',
  'DESPESAS COM ALIMENTAÇÃO',
  'DESPESA LAZER',
  'DESPESA PESSOAL',
  'DESPESA COM CASA',
  'DESPESA COM TRANSPORTE',
  'INVESTIMENTO',
  'DESPESA COM SAÚDE',
  'PATRIMÔNIO'
]

const BANKS = [
  'ITAÚ',
  'NUBANK',
  'COFRINHO NUBANK',
  'C6 BANK',
  'INTER',
  'BRADESCO',
  'SANTANDER',
  'XP',
  'DINHEIRO ESPÉCIE'
]

export function parseLocalNLP(text: string, currentUser: 'Felipe' | 'Mara'): ParsedTransaction {
  const lower = text.toLowerCase()
  const today = new Date().toISOString().split('T')[0]

  // Extract amount: handles "R$ 20", "20 reais", "20,50", "20.50", "de 20"
  let amount = 0
  const matchMoney = lower.match(/(?:r\$\s*|reais\s*|de\s*|valor\s*de\s*)?(\d+(?:[.,]\d{1,2})?)\s*(?:reais|real|conto)?/i)
  if (matchMoney) {
    const rawNum = matchMoney[1].replace(',', '.')
    amount = parseFloat(rawNum) || 0
  }

  // Type: receivable or payable
  const isReceivable = /recebi|ganhei|sal[aá]rio|renda|entrada|pix recebido|lucro|comiss[aã]o/i.test(lower)
  const type: 'payable' | 'receivable' = isReceivable ? 'receivable' : 'payable'

  // Bank detection
  let bank = 'ITAÚ'
  if (/c6/i.test(lower)) bank = 'C6 BANK'
  else if (/nubank|roxinho/i.test(lower)) bank = 'NUBANK'
  else if (/cofrinho/i.test(lower)) bank = 'COFRINHO NUBANK'
  else if (/ita[uú]/i.test(lower)) bank = 'ITAÚ'
  else if (/inter/i.test(lower)) bank = 'INTER'
  else if (/bradesco/i.test(lower)) bank = 'BRADESCO'
  else if (/santander/i.test(lower)) bank = 'SANTANDER'
  else if (/xp/i.test(lower)) bank = 'XP'
  else if (/dinheiro|esp[eé]cie/i.test(lower)) bank = 'DINHEIRO ESPÉCIE'

  // Payment Method detection
  let payment_method = 'PIX'
  if (/cr[eé]dito|cart[aã]o/i.test(lower)) payment_method = 'CARTÃO DE CRÉDITO'
  else if (/d[eé]bito/i.test(lower)) payment_method = 'DÉBITO'
  else if (/dinheiro/i.test(lower)) payment_method = 'DINHEIRO'
  else if (/boleto/i.test(lower)) payment_method = 'BOLETO'
  else if (/pix/i.test(lower)) payment_method = 'PIX'

  // Category & Subcategory & Title detection
  let category = 'DESPESAS COM ALIMENTAÇÃO'
  let sub_category = 'MERCADO'
  let title = 'COMPRA'

  if (/supermercado|mercado|carrefour|extra|atacad|compras/i.test(lower)) {
    category = 'DESPESAS COM ALIMENTAÇÃO'
    sub_category = 'MERCADO'
    title = 'SUPERMERCADO'
  } else if (/padaria|p[aã]o|caf[eé]/i.test(lower)) {
    category = 'DESPESAS COM ALIMENTAÇÃO'
    sub_category = 'PADARIA'
    title = 'PADARIA'
  } else if (/a[cç]ougue|carne/i.test(lower)) {
    category = 'DESPESAS COM ALIMENTAÇÃO'
    sub_category = 'AÇOUGUE'
    title = 'AÇOUGUE'
  } else if (/peixaria|peixe/i.test(lower)) {
    category = 'DESPESAS COM ALIMENTAÇÃO'
    sub_category = 'PEIXARIA'
    title = 'PEIXARIA'
  } else if (/gasolina|combust[ií]vel|abastec|posto/i.test(lower)) {
    category = 'DESPESA COM TRANSPORTE'
    sub_category = 'GASOLINA CARRO'
    title = 'COMBUSTÍVEL'
  } else if (/moto|biz/i.test(lower)) {
    category = 'DESPESA COM TRANSPORTE'
    sub_category = /biz/i.test(lower) ? 'GASOLINA BIZ' : 'GASOLINA MOTO'
    title = 'COMBUSTÍVEL MOTO'
  } else if (/farm[aá]cia|rem[eé]dio|drogaria/i.test(lower)) {
    category = 'DESPESA COM SAÚDE'
    sub_category = 'FARMÁCIA'
    title = 'FARMÁCIA'
  } else if (/exame|hospital|consulta/i.test(lower)) {
    category = 'DESPESA COM SAÚDE'
    sub_category = /exame/i.test(lower) ? 'EXAME' : 'HOSPITAL'
    title = 'SAÚDE'
  } else if (/luz|energia|cemig|enel/i.test(lower)) {
    category = 'DESPESA COM CASA'
    sub_category = 'LUZ'
    title = 'CONTA DE LUZ'
  } else if (/[aá]gua|copasa|sanepar/i.test(lower)) {
    category = 'DESPESA COM CASA'
    sub_category = 'ÁGUA'
    title = 'CONTA DE ÁGUA'
  } else if (/internet|wifi|fibra/i.test(lower)) {
    category = 'DESPESA COM CASA'
    sub_category = 'INTERNET'
    title = 'INTERNET'
  } else if (/almo[cç]o|jantar|restaurante|lanche|pizza|hamb[uú]rguer|ifood|delivery/i.test(lower)) {
    category = 'DESPESA LAZER'
    sub_category = 'LANCHONETE'
    title = 'RESTAURANTE / LANCHE'
  } else if (/sorvete/i.test(lower)) {
    category = 'DESPESA LAZER'
    sub_category = 'SORVETERIA'
    title = 'SORVETERIA'
  } else if (/viagem|hotel/i.test(lower)) {
    category = 'DESPESA LAZER'
    sub_category = 'VIAGEM'
    title = 'VIAGEM'
  } else if (/netflix|streaming|spotify|tv box/i.test(lower)) {
    category = 'DESPESA LAZER'
    sub_category = /tv/i.test(lower) ? 'TV BOX' : 'NETFLIX'
    title = 'STREAMING'
  } else if (/cabelo|barba|sal[aã]o/i.test(lower)) {
    category = 'DESPESA PESSOAL'
    sub_category = 'CABELO'
    title = 'CABELO / BELEZA'
  } else if (/academia|muscula[cç][aã]o/i.test(lower)) {
    category = 'DESPESA PESSOAL'
    sub_category = 'ACADEMIA'
    title = 'ACADEMIA'
  } else if (/roupa|cal[cç]ado|t[eê]nis/i.test(lower)) {
    category = 'DESPESA PESSOAL'
    sub_category = 'ROUPAS'
    title = 'ROUPAS'
  } else if (/sal[aá]rio/i.test(lower)) {
    category = 'RECEITA SALÁRIO'
    sub_category = currentUser === 'Mara' ? 'SALÁRIO MARA' : 'SALÁRIO FELIPE'
    title = 'SALÁRIO ' + currentUser.toUpperCase()
  } else if (/hora extra|extra/i.test(lower)) {
    category = 'RECEITA EXTRA'
    sub_category = 'HORAS EXTRAS'
    title = 'HORAS EXTRAS'
  }

  return {
    title,
    amount,
    type,
    category,
    sub_category,
    bank,
    payment_method,
    date: today,
    notes: `[Gasto: ${currentUser}]`,
    status: 'pending'
  }
}

export async function parseWithGemini(
  text: string,
  currentUser: 'Felipe' | 'Mara',
  apiKey: string
): Promise<ParsedTransaction> {
  const today = new Date().toISOString().split('T')[0]

  const systemPrompt = `Você é um assistente financeiro do casal Felipe e Mara.
Extraia os dados da frase em português: "${text}".
Quem está registrando agora: ${currentUser}.
Data atual: ${today}.

Opções válidas:
Categorias:
- RECEITA SALÁRIO (Sub: SALÁRIO FELIPE, SALÁRIO MARA)
- RECEITA EXTRA (Sub: HORAS EXTRAS, DINHEIRO VÓ BIA, DIVISÃO DE LUCRO EMPRESA, MÊS ANTERIOR)
- DESPESAS COM ALIMENTAÇÃO (Sub: MERCADO, PADARIA, AÇOUGUE, PEIXARIA)
- DESPESA LAZER (Sub: LANCHONETE, SORVETERIA, VIAGEM, NETFLIX, TV BOX)
- DESPESA PESSOAL (Sub: CABELO, MESADA, DIZIMO, ROUPAS, ACESSÓRIOS, ACADEMIA)
- DESPESA COM CASA (Sub: ÁGUA, LUZ, INTERNET, TERRENO, OUTROS)
- DESPESA COM TRANSPORTE (Sub: GASOLINA MOTO, GASOLINA BIZ, GASOLINA CARRO, CONSERTO DA MOTO, CONSERTO DA BIZ, DESPESA COM CARRO)
- INVESTIMENTO (Sub: RENDA FIXA, RENDA VARIAVEL, RESERVA DE EMERGENCIA)
- DESPESA COM SAÚDE (Sub: FARMÁCIA, EXAME, HOSPITAL)

Bancos: ["ITAÚ", "NUBANK", "COFRINHO NUBANK", "C6 BANK", "INTER", "BRADESCO", "SANTANDER", "XP", "DINHEIRO ESPÉCIE"]
Métodos: ["PIX", "CARTÃO DE CRÉDITO", "DÉBITO", "BOLETO", "DINHEIRO"]

Responda APENAS um JSON no seguinte formato (sem markdown, sem crases):
{
  "title": "SUPERMERCADO",
  "amount": 20.0,
  "type": "payable" ou "receivable",
  "category": "DESPESAS COM ALIMENTAÇÃO",
  "sub_category": "MERCADO",
  "bank": "C6 BANK",
  "payment_method": "CARTÃO DE CRÉDITO",
  "date": "${today}",
  "notes": "[Gasto: ${currentUser}]"
}`

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: systemPrompt }]
          }
        ]
      })
    }
  )

  if (!response.ok) {
    throw new Error(`Erro na API Gemini: ${response.statusText}`)
  }

  const data = await response.json()
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
  
  // Limpa markdown caso venha com ```json ... ```
  const cleanJson = rawText.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim()
  const parsed = JSON.parse(cleanJson)

  return {
    title: (parsed.title || 'COMPRA').toUpperCase(),
    amount: Number(parsed.amount) || 0,
    type: parsed.type === 'receivable' ? 'receivable' : 'payable',
    category: parsed.category || 'DESPESAS COM ALIMENTAÇÃO',
    sub_category: parsed.sub_category || 'MERCADO',
    bank: parsed.bank || 'ITAÚ',
    payment_method: parsed.payment_method || 'PIX',
    date: parsed.date || today,
    notes: `[Gasto: ${currentUser}]`,
    status: 'pending'
  }
}

export async function parseTransaction(
  text: string,
  currentUser: 'Felipe' | 'Mara',
  apiKey?: string
): Promise<{ result: ParsedTransaction; source: 'gemini' | 'local' }> {
  if (apiKey && apiKey.trim().length > 10) {
    try {
      const geminiResult = await parseWithGemini(text, currentUser, apiKey.trim())
      return { result: geminiResult, source: 'gemini' }
    } catch (err) {
      console.warn('Falha na API Gemini, usando motor local resiliente:', err)
    }
  }

  return { result: parseLocalNLP(text, currentUser), source: 'local' }
}
