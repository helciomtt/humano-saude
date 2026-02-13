"""
Serviço de IA para extração inteligente de dados de PDFs
Utiliza OpenAI GPT-4 para análise de documentos de planos de saúde
"""
import os
import json
from typing import Dict, List, Optional
from pypdf import PdfReader
from openai import OpenAI
from dotenv import load_dotenv
import io

# Carregar variáveis de ambiente
load_dotenv()


class AIService:
    """Serviço de IA para processamento de documentos"""
    
    def __init__(self):
        """Inicializa o cliente OpenAI"""
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY não encontrada nas variáveis de ambiente")
        
        self.client = OpenAI(api_key=api_key)
        self.model = "gpt-4o-mini"
    
    def extrair_texto_pdf(self, file_bytes: bytes) -> str:
        """
        Extrai texto de um arquivo PDF
        
        Args:
            file_bytes: Bytes do arquivo PDF
            
        Returns:
            str: Texto extraído do PDF
        """
        try:
            # Criar um objeto de arquivo em memória
            pdf_file = io.BytesIO(file_bytes)
            
            # Ler o PDF
            reader = PdfReader(pdf_file)
            
            # Extrair texto de todas as páginas
            texto_completo = []
            for page in reader.pages:
                texto = page.extract_text()
                if texto:
                    texto_completo.append(texto)
            
            return "\n\n".join(texto_completo)
        
        except Exception as e:
            raise ValueError(f"Erro ao extrair texto do PDF: {str(e)}")
    
    def analisar_documento_saude(self, texto_pdf: str) -> Dict:
        """
        Analisa documento de plano de saúde usando OpenAI
        
        Args:
            texto_pdf: Texto extraído do PDF
            
        Returns:
            Dict: Dados estruturados extraídos
        """
        prompt = f"""
Você é um especialista em análise de documentos de planos de saúde.

Analise o documento abaixo e extraia as seguintes informações:
- **idades**: lista de idades dos beneficiários (números inteiros)
- **operadora**: nome da operadora de saúde (ex: AMIL, BRADESCO, SULAMERICA, UNIMED, etc)
- **valor_atual**: valor atual do plano (número decimal, sem símbolo de moeda)
- **tipo_plano**: tipo de plano se mencionado (ADESAO, PME, EMPRESARIAL ou null)
- **nome_beneficiarios**: lista com nomes dos beneficiários se disponíveis
- **observacoes**: qualquer informação relevante adicional

**IMPORTANTE:**
- Se não encontrar alguma informação, use null
- Para idades, extraia APENAS números
- Para operadora, use o nome em MAIÚSCULAS
- Para valor, use apenas números (ex: 1500.50)

Retorne APENAS um objeto JSON válido, sem texto adicional.

DOCUMENTO:
{texto_pdf}

JSON:
"""
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "Você é um assistente especializado em extrair dados estruturados de documentos de planos de saúde. Sempre retorne JSON válido."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.1,  # Baixa temperatura para respostas mais consistentes
                response_format={"type": "json_object"}  # Força resposta JSON
            )
            
            # Extrair resposta
            resposta_texto = response.choices[0].message.content
            
            # Parsear JSON
            dados_extraidos = json.loads(resposta_texto)
            
            # Validar e limpar dados
            return self._validar_dados_extraidos(dados_extraidos)
        
        except json.JSONDecodeError as e:
            raise ValueError(f"Erro ao parsear resposta da IA: {str(e)}")
        except Exception as e:
            raise ValueError(f"Erro ao analisar documento com IA: {str(e)}")
    
    def _validar_dados_extraidos(self, dados: Dict) -> Dict:
        """
        Valida e normaliza dados extraídos
        
        Args:
            dados: Dados brutos extraídos
            
        Returns:
            Dict: Dados validados e normalizados
        """
        resultado = {
            "idades": [],
            "operadora": None,
            "valor_atual": None,
            "tipo_plano": None,
            "nome_beneficiarios": [],
            "observacoes": None,
            "confianca": "alta"  # Indicador de confiança na extração
        }
        
        # Validar idades
        if "idades" in dados and isinstance(dados["idades"], list):
            resultado["idades"] = [
                int(idade) for idade in dados["idades"] 
                if isinstance(idade, (int, float, str)) and str(idade).isdigit()
            ]
        
        # Validar operadora
        if "operadora" in dados and dados["operadora"]:
            resultado["operadora"] = str(dados["operadora"]).upper().strip()
        
        # Validar valor
        if "valor_atual" in dados and dados["valor_atual"]:
            try:
                valor = float(str(dados["valor_atual"]).replace(",", "."))
                resultado["valor_atual"] = round(valor, 2)
            except (ValueError, TypeError):
                resultado["valor_atual"] = None
        
        # Validar tipo de plano
        if "tipo_plano" in dados and dados["tipo_plano"]:
            tipo = str(dados["tipo_plano"]).upper()
            if tipo in ["ADESAO", "PME", "EMPRESARIAL"]:
                resultado["tipo_plano"] = tipo
        
        # Validar nomes
        if "nome_beneficiarios" in dados and isinstance(dados["nome_beneficiarios"], list):
            resultado["nome_beneficiarios"] = [
                str(nome).strip() for nome in dados["nome_beneficiarios"] if nome
            ]
        
        # Observações
        if "observacoes" in dados and dados["observacoes"]:
            resultado["observacoes"] = str(dados["observacoes"])
        
        return resultado
    
    async def processar_pdf_completo(self, file_bytes: bytes) -> Dict:
        """
        Pipeline completo: extrai texto do PDF e analisa com IA
        
        Args:
            file_bytes: Bytes do arquivo PDF
            
        Returns:
            Dict: Dados estruturados extraídos
        """
        # Extrair texto
        texto = self.extrair_texto_pdf(file_bytes)
        
        if not texto or len(texto.strip()) < 50:
            raise ValueError("PDF vazio ou com pouco conteúdo para análise")
        
        # Analisar com IA
        dados = self.analisar_documento_saude(texto)
        
        # Adicionar metadados
        dados["texto_extraido_preview"] = texto[:500] + "..." if len(texto) > 500 else texto
        dados["total_caracteres"] = len(texto)
        
        return dados


# Instância singleton do serviço
ai_service = AIService()
