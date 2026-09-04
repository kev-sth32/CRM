// AI Pitch & Social Ad Creative Studio Service
// Inspired by Alippo AI Co-founder: generates personalized WhatsApp pitches and social ad creatives

class PitchStudioService {
  generateWhatsAppPitch({ lead, tone = 'consultative', language = 'nepglish', product = null, tenant = {} }) {
    const contactName = (lead && (lead.name || lead.first_name)) || 'there';
    const company = (lead && lead.company) || 'your company';
    const productName = product ? product.name : 'SalesOS Enterprise Suite';
    const currency = tenant.currency || 'NPR';

    if (language === 'nepglish') {
      if (tone === 'urgent') {
        return {
          headline: `Namaste ${contactName} ji! SalesOS exclusive offer for ${company}`,
          message: `Namaste ${contactName} ji! Ma Arjun from SalesOS boliraheko chhu. Tapai ko ${company} ma sales leads track garna ra WhatsApp inquiries organize garna hamro new ${productName} launch bhayeko chha. Aaja matra book garda free 1-on-1 team onboarding paucha. Ekchoti 10-minute quick demo herne ho? Reply with "YES" to connect. Dhanyabaad!`,
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
}

module.exports = new PitchStudioService();
