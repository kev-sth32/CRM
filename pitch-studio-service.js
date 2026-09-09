// AI Pitch & Social Ad Creative Studio Service
// Inspired by Alippo AI Co-founder: generates personalized WhatsApp pitches and social ad creatives

class PitchStudioService {
  generateWhatsAppPitch({ lead, tone = 'consultative', language = 'nepglish', product = null, tenant = {} }) {
    const contactName = (lead && (lead.name || lead.first_name)) || 'there';
    const company = (lead && lead.company) || 'your company';
    const productName = product ? product.name : 'SalesOS Enterprise Suite';
    const currency = tenant.currency || 'NPR';
    const orgName = tenant.name || 'SalesOS';
    const repName = (lead && lead.owner_name) || 'hamro sales team';

    if (language === 'nepglish') {
      if (tone === 'urgent') {
        return {
          headline: `Namaste ${contactName} ji! ${orgName} exclusive offer for ${company}`,
          message: `Namaste ${contactName} ji! Ma ${repName} from ${orgName} boliraheko chhu. Tapai ko ${company} ma sales leads track garna ra WhatsApp inquiries organize garna hamro new ${productName} launch bhayeko chha. Aaja matra book garda free 1-on-1 team onboarding paucha. Ekchoti 10-minute quick demo herne ho? Reply with "YES" to connect. Dhanyabaad!`,
          call_to_action: 'Reply with "YES" for instant demo link',
          platform: 'whatsapp',
          language: 'nepglish'
        };
      }
      return {
        headline: `Namaste ${contactName} ji, inquiry regarding ${productName}`,
        message: `Namaste ${contactName} ji! Tapai ko inquiry herera maile yo message gareko. ${company} ko sales workflow automate garna ra follow-up miss nahuna hamro ${productName} perfect solution ho. Tapai ko requirement anusar custom demo schedule garna sakincha. Free demo ko lagi kaile time hunchha hola? Dhanyabaad!`,
        call_to_action: 'Reply to schedule convenient demo time',
        platform: 'whatsapp',
        language: 'nepglish'
      };
    }

    if (language === 'nepali') {
      return {
        headline: `नमस्ते ${contactName} जी, SalesOS को तर्फबाट`,
        message: `नमस्ते ${contactName} जी! तपाइँको कम्पनी ${company} को बिक्री र ग्राहक व्यवस्थापनलाई अझ प्रभावकारी बनाउन SalesOS को ${productName} उपलब्ध छ। के तपाइँ यसको छोटो डेमो हेर्न इच्छुक हुनुहुन्छ? थप जानकारीको लागि कृपया उत्तर दिनुहोला। धन्यवाद!`,
        call_to_action: 'डेमोको लागि उत्तर पठाउनुहोस्',
        platform: 'whatsapp',
        language: 'nepali'
      };
    }

    // Default English
    return {
      headline: `Hi ${contactName}, quick idea for ${company}`,
      message: `Hi ${contactName}, noticed your team at ${company} is scaling revenue operations. With ${productName}, teams in South Asia automate up to 68% of inbound lead nurturing and close proposals 3.8 days faster. Would love to share a quick 10-minute personalized walkthrough. Does tomorrow afternoon work for a quick call?`,
      call_to_action: 'Book 10-minute discovery call',
      platform: 'whatsapp',
      language: 'english'
    };
  }

  generateSocialAdCopy({ product, platform = 'facebook', goal = 'lead_generation', targetAudience = 'Nepali SMEs & Consultancies' }) {
    const pName = (product && product.name) || 'SalesOS Cloud CRM';
    const pPrice = product && product.unit_price ? `Starts at NPR ${Number(product.unit_price).toLocaleString()}/mo` : 'Affordable local NPR pricing';

    if (platform === 'facebook' || platform === 'instagram') {
      return {
        headline: `Stop Losing 40% of Your Sales Leads on WhatsApp & Spreadsheets! 🚀`,
        primary_text: `Are your sales reps still copy-pasting customer phone numbers into Excel sheets? When reps leave, your customer contacts leave with them.\n\nTransform your business with ${pName} — the all-in-one AI Sales Operating System built for Nepal. Manage WhatsApp leads, automate follow-ups, and send verified 13% VAT quotations in seconds.`,
        bullets: [
          '⚡ Unified WhatsApp & WebChat Inbound Inbox',
          '📊 Visual Sales Pipeline & Quota Forecasting',
          '📄 1-Click Digital Proposals with E-Signatures',
          '🔒 Bank-grade security with local Fonepay / eSewa billing'
        ],
        price_hook: pPrice,
        call_to_action: 'Sign Up for 14-Day Free Trial',
        hashtags: ['#SalesOS', '#NepalBusiness', '#CRMNepal', '#DigitalNepal', '#KathmanduStartups', '#B2BSales']
      };
    }

    return {
      headline: `Accelerate Your B2B Revenue with ${pName}`,
      primary_text: `Built for fast-growing sales teams in South Asia. Replace scattered spreadsheets and disconnects with an enterprise-grade AI revenue engine.`,
      call_to_action: 'Schedule Enterprise Demo',
      hashtags: ['#SaaS', '#EnterpriseSales', '#CRM', '#SalesAutomation']
    };
  }

  async generateWhatsAppPitchAsync({ lead, tone = 'consultative', language = 'nepglish', product = null, tenant = {}, aiProvider = null, model = null }) {
    const fallback = this.generateWhatsAppPitch({ lead, tone, language, product, tenant });
    if (!aiProvider) return fallback;

    const contactName = (lead && (lead.name || lead.first_name)) || 'there';
    const company = (lead && lead.company) || 'your company';
    const productName = product ? product.name : 'SalesOS Enterprise Suite';

    try {
      const prompt = `Write a personalized B2B WhatsApp sales outreach message in ${language} with a ${tone} tone to ${contactName} at ${company} presenting ${productName}. Keep it under 3-4 sentences. Include a friendly greeting and clear call-to-action to schedule a demo. Return ONLY the message text without quotes.`;
      const res = await aiProvider.generate({
        model,
        temperature: 0.7,
        max_tokens: 300,
        system: 'You are an elite B2B sales copywriter specializing in high-converting WhatsApp pitches for South Asian businesses. Be concise, respectful, and compelling.',
        messages: [{ role: 'user', content: prompt }]
      });

      if (res?.text && res.text.trim().length > 20) {
        return {
          ...fallback,
          message: res.text.trim(),
          ai_model: res.model,
          live_generation: true
        };
      }
    } catch (_) {
      // Graceful fallback to deterministic template
    }
    return fallback;
  }

  async generateSocialAdCopyAsync({ product, platform = 'facebook', goal = 'lead_generation', targetAudience = 'Nepali SMEs & Consultancies', aiProvider = null, model = null }) {
    const fallback = this.generateSocialAdCopy({ product, platform, goal, targetAudience });
    if (!aiProvider) return fallback;

    const pName = (product && product.name) || 'SalesOS Cloud CRM';

    try {
      const prompt = `Generate high-converting ${platform} ad copy promoting ${pName} targeting ${targetAudience} with the goal of ${goal}. Include a punchy headline with emojis, concise value propositions, and an irresistible call to action. Format as:
HEADLINE: [headline]
BODY: [primary text]
CTA: [call to action]`;
      const res = await aiProvider.generate({
        model,
        temperature: 0.7,
        max_tokens: 500,
        system: 'You are an expert social media growth marketer. Write engaging, relatable B2B ad copy with high click-through rates.',
        messages: [{ role: 'user', content: prompt }]
      });

      if (res?.text) {
        const text = res.text.trim();
        const headlineMatch = text.match(/HEADLINE:\s*(.+)/i);
        const bodyMatch = text.match(/BODY:\s*([\s\S]+?)(?=CTA:|$)/i);
        const ctaMatch = text.match(/CTA:\s*(.+)/i);

        return {
          ...fallback,
          headline: headlineMatch ? headlineMatch[1].trim() : fallback.headline,
          primary_text: bodyMatch ? bodyMatch[1].trim() : text,
          call_to_action: ctaMatch ? ctaMatch[1].trim() : fallback.call_to_action,
          ai_model: res.model,
          live_generation: true
        };
      }
    } catch (_) {
      // Graceful fallback to deterministic template
    }
    return fallback;
  }
}

module.exports = new PitchStudioService();
