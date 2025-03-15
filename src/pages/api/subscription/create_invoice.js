import Stripe from 'stripe';
import { withAuth } from '@/utils/auth';

// 初始化Stripe客户端
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * 创建发票API处理函数
 * 根据提供的PaymentIntent ID生成发票
 */
async function handler(req, res) {
  // 只允许POST请求
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
    return;
  }

  // 从请求体中获取PaymentIntent ID
  const { paymentIntentId } = req.body;
  
  // 验证PaymentIntent ID是否存在
  if (!paymentIntentId) {
    return res.status(400).json({ 
      success: false, 
      message: '缺少必要参数: paymentIntentId' 
    });
  }

  // 获取当前用户邮箱
  const email = req.user.email;

  try {
    // 1. 获取支付意向详情
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (!paymentIntent) {
      return res.status(404).json({
        success: false,
        message: '未找到指定的支付意向'
      });
    }

    // 2. 获取或创建客户
    let customerId;
    
    if (paymentIntent.customer) {
      // 如果支付意向已关联客户，直接使用
      customerId = paymentIntent.customer;
    } else {
      // 否则创建新客户
      const customer = await stripe.customers.create({
        email: email,
        description: `Customer for ${email}`,
        metadata: {
          paymentIntentId: paymentIntentId
        }
      });
      customerId = customer.id;
    }

    // 3. 创建发票项目
    const invoiceItem = await stripe.invoiceItems.create({
      customer: customerId,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      description: paymentIntent.description || `Payment for services (${paymentIntentId})`,
    });

    // 4. 创建发票
    const invoice = await stripe.invoices.create({
      customer: customerId,
      auto_advance: true, // 自动完成发票
      collection_method: 'charge_automatically',
      description: `Invoice for payment ${paymentIntentId}`,
      metadata: {
        paymentIntentId: paymentIntentId
      }
    });

    // 5. 完成发票
    const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);

    // 6. 发送发票邮件（可选）
    await stripe.invoices.sendInvoice(finalizedInvoice.id);

    // 返回成功响应
    res.status(200).json({ 
      success: true, 
      invoice: finalizedInvoice 
    });
  } catch (err) {
    // 错误处理
    console.error('创建发票错误:', err);
    res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
}

// 导出带身份验证的处理函数
export default withAuth(handler); 