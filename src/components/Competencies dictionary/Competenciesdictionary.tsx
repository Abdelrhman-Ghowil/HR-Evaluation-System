import React, { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { BookOpen, ChevronDown, ChevronUp, Crown, Search, Sparkles, X } from 'lucide-react';

// ==================== TYPES ====================
type Language = 'en' | 'ar';

interface ProficiencyLevel {
  level: number;
  title: string;
  titleAr?: string;
  description: string;
  descriptionAr?: string;
  behaviors: string[];
  behaviorsAr?: string[];
}

interface Competency {
  id: string;
  name: string;
  nameAr?: string;
  definition: string;
  definitionAr?: string;
  type: 'core' | 'leadership';
  proficiencyLevels: ProficiencyLevel[];
}

type CompetencyType = 'all' | 'core' | 'leadership';

// ==================== UI LABELS ====================
const uiLabels = {
  en: {
    title: 'Competencies Dictionary',
    subtitle: 'Reference guide for core and leadership competencies.',
    coreCompetencies: 'Core Competencies',
    leadershipCompetencies: 'Leadership Competencies',
    functionalCompetencies: 'Functional Competencies',
    total: 'Total',
    allCompetencies: 'All Competencies',
    core: 'Core',
    leadership: 'Leadership',
    searchPlaceholder: 'Search competencies...',
    showing: 'Showing',
    competencies: 'competencies',
    definition: 'Definition',
    proficiencyLevels: 'Proficiency Levels',
    expectedBehaviors: 'Expected Behaviors',
    level: 'Level',
    coreCompetencyLabel: 'Core Competency',
    leadershipCompetencyLabel: 'Leadership Competency',
    noResults: 'No results found',
    noResultsHint: 'Try adjusting your search or filter.',
    clearFilters: 'Clear filters',
    competenciesStructure: 'Competencies Structure',
    structureDescription: 'The Competency Structure includes the Competency types, proficiency levels and degree of detail for each competency. The figure below illustrates the different types of Competencies identified:',
    corePoints: [
      "Directly related to Ninja's strategy, vision, values and culture.",
      'Required from all job holders within Ninja.',
    ],
    leadershipPoints: [
      'Directly related to the organizational structure and the managerial levels.',
      'Required from job holders whose jobs have a managerial aspect to their nature.',
    ],
    functionalPoints: [
      'Related to the functional nature of the job.',
      'Required from job holders that share a common functional background.',
    ],
  },
  ar: {
    title: 'قاموس الكفاءات',
    subtitle: 'دليل مرجعي للكفاءات الأساسية والقيادية.',
    coreCompetencies: 'الكفاءات الأساسية',
    leadershipCompetencies: 'الكفاءات القيادية',
    functionalCompetencies: 'الكفاءات الوظيفية',
    total: 'الإجمالي',
    allCompetencies: 'جميع الكفاءات',
    core: 'أساسية',
    leadership: 'قيادية',
    searchPlaceholder: 'البحث في الكفاءات...',
    showing: 'عرض',
    competencies: 'كفاءات',
    definition: 'التعريف',
    proficiencyLevels: 'مستوى الاتقان',
    expectedBehaviors: 'السلوكيات المتوقعة',
    level: 'المستوى',
    coreCompetencyLabel: 'جدارة أساسية',
    leadershipCompetencyLabel: 'جدارة قيادية',
    noResults: 'لا توجد نتائج',
    noResultsHint: 'حاول تعديل البحث أو التصفية.',
    clearFilters: 'مسح التصفية',
    competenciesStructure: 'هيكل الكفاءات',
    structureDescription: 'يشمل هيكل الكفاءات في نينجا أنواع الكفاءات، ومستويات الإتقان، ودرجة التفصيل لكل كفاءة. يوضّح الشكل أدناه الأنواع المختلفة من الكفاءات التي تم تحديدها في نينجا:',
    corePoints: [
      'مرتبطة بشكل مباشر باستراتيجية نينجا، ورؤيتها، وقيمها، وثقافتها.',
      'مطلوبة من جميع شاغلي الوظائف في نينجا.',
    ],
    leadershipPoints: [
      'مرتبطة بشكل مباشر بالهيكل التنظيمي والمستويات الإدارية.',
      'مطلوبة من شاغلي الوظائف التي تتضمن طبيعتها جانبًا إداريًا.',
    ],
    functionalPoints: [
      'مرتبطة بالطبيعة الوظيفية للوظيفة.',
      'مطلوبة من شاغلي الوظائف الذين يشتركون في خلفية وظيفية مشتركة.',
    ],
  },
};

// ==================== DATA ====================
const competenciesData: Competency[] = [
  // CORE COMPETENCIES
  {
    id: 'problem-solving',
    name: 'Problem Solving',
    nameAr: 'حل المشاكل',
    type: 'core',
    definition: 'The ability to identify problems, analyze root causes, generate effective solutions, and make sound decisions in a timely and systematic manner to achieve optimal outcomes.',
    definitionAr: 'القدرة على تحديد المشكلات، وتحليل الأسباب الجذرية، وتوليد حلول فعّالة، واتخاذ قرارات سليمة بطريقة منهجية وفي الوقت المناسب لتحقيق أفضل النتائج.',
    proficiencyLevels: [
      {
        level: 1,
        title: 'Basic',
        titleAr: 'أساسي',
        description: 'The ability to identify simple problems and seek guidance to resolve them.',
        descriptionAr: 'القدرة على تحديد المشكلات البسيطة وطلب الإرشاد لحلها:',
        behaviors: ['Recognizes problems and reports them promptly.', 'Collects basic information related to the issue.', 'Follows established procedures to address problems.', 'Seeks support when facing unfamiliar situations.'],
        behaviorsAr: ['يلاحظ المشكلات ويبلغ عنها على الفور.', 'يجمع المعلومات الأساسية المتعلقة بالمشكلة.', 'يتبع الإجراءات المعتمدة لمعالجة المشكلات.', 'يطلب الدعم عند مواجهة مواقف غير مألوفة.'],
      },
      {
        level: 2,
        title: 'Intermediate',
        titleAr: 'متوسط',
        description: 'The ability to analyze problems and propose appropriate solutions independently.',
        descriptionAr: 'القدرة على تحليل المشكلات واقتراح الحلول المناسبة بشكل مستقل:',
        behaviors: ['Analyzes problems by breaking them into manageable components.', 'Identifies root causes using logical thinking.', 'Suggests practical and effective solutions.', 'Evaluates potential risks before implementing solutions.'],
        behaviorsAr: ['يحلل المشكلات بتقسيمها إلى مكونات قابلة للإدارة.', 'يحدد الأسباب الجذرية باستخدام التفكير المنطقي.', 'يقترح حلولاً عملية وفعالة.', 'يقيم المخاطر المحتملة قبل تنفيذ الحلول.'],
      },
      {
        level: 3,
        title: 'Advanced',
        titleAr: 'متقدم',
        description: 'The ability to handle complex problems and guide others in problem-solving.',
        descriptionAr: 'القدرة على التعامل مع المشكلات المعقدة وتوجيه الآخرين في حلها:',
        behaviors: ['Anticipates potential problems and takes preventive actions.', 'Applies structured problem-solving techniques and best practices.', 'Supports and guides colleagues in resolving challenges.', 'Balances multiple factors (cost, quality, time) when deciding on solutions.'],
        behaviorsAr: ['يتوقع المشكلات المحتملة ويتخذ إجراءات وقائية.', 'يطبق تقنيات حل المشكلات المنظمة وأفضل الممارسات.', 'يدعم ويرشد الزملاء في مواجهة التحديات وحلها.', 'يوازن بين عدة عوامل (التكلفة، الجودة، الوقت) عند اتخاذ قرارات الحلول.'],
      },
      {
        level: 4,
        title: 'Expert',
        titleAr: 'خبير',
        description: 'The ability to solve strategic and high-impact problems and drive organizational improvement.',
        descriptionAr: 'القدرة على حل المشكلات الاستراتيجية وذات التأثير العالي ودفع تحسين المنظمة:',
        behaviors: ['Addresses complex, cross-functional, and strategic problems.', 'Develops innovative and long-term solutions aligned with organizational goals.', 'Ensures decisions are data-driven and consider broader organizational impact.', 'Builds a problem-solving culture by empowering teams.'],
        behaviorsAr: ['يتعامل مع المشكلات المعقدة وعبر الوظائف والمشكلات الاستراتيجية.', 'يطور حلولاً مبتكرة وطويلة الأمد تتماشى مع أهداف المنظمة.', 'يضمن أن تكون القرارات قائمة على البيانات ومراعية للتأثير الأوسع على المنظمة.', 'يبني ثقافة حل المشكلات من خلال تمكين الفرق ووضع أطر واضحة لاتخاذ القرار.'],
      },
    ],
  },
  {
    id: 'communication',
    name: 'Communication',
    nameAr: 'التواصل',
    type: 'core',
    definition: 'The ability and skill of effectively interacting and exchanging information with others through expressing oneself clearly and concisely.',
    definitionAr: 'القدرة والمهارة على التفاعل الفعال وتبادل المعلومات مع الآخرين من خلال التعبير عن النفس بوضوح واختصار، وتقديم المعلومات بدقة وفي الوقت المناسب، بالإضافة إلى اكتساب وفهم المعلومات من الآخرين بشكل كاف.',
    proficiencyLevels: [
      {
        level: 1,
        title: 'Basic',
        titleAr: 'أساسي',
        description: 'The ability to listen carefully and objectively, and exchange information adequately.',
        descriptionAr: 'القدرة على الاستماع بعناية وموضوعية وتبادل المعلومات بشكل مناسب:',
        behaviors: ['Promptly provides factual and concise information.', 'Delivers verbal and written messages effectively.', 'Understands comments and feedback from others correctly.'],
        behaviorsAr: ['يقدم المعلومات الواقعية والموجزة بسرعة إلى الأشخاص المعنيين.', 'يمتلك القدرة على إيصال الرسائل الشفوية والمكتوبة بفعالية ومهنية، مع استخدام اللغة المناسبة والقواعد الصحيحة.', 'يمتلك القدرة على فهم ملاحظات وتعليقات الآخرين بشكل صحيح وتدوين النقاط المهمة.'],
      },
      {
        level: 2,
        title: 'Intermediate',
        titleAr: 'متوسط',
        description: 'The ability to convey and receive information effectively with different levels.',
        descriptionAr: 'القدرة على نقل واستقبال المعلومات بفعالية مع المستويات المختلفة داخل نينجا، شفويًا وكتابيًا، بالإضافة إلى القدرة على كشف المعاني الضمنية:',
        behaviors: ['Ensures effective communication by considering different factors.', 'Possesses the ability to detect underlying meanings.', 'Communicates effectively with different levels.', 'Realizes and understands verbal and non-verbal cues.'],
        behaviorsAr: ['يضمن التواصل الفعال مع الآخرين مع مراعاة عوامل مختلفة مثل الجمهور والموضوع وغيرها.', 'يمتلك القدرة على كشف المعاني الضمنية.', 'يتواصل بفعالية مع المستويات المختلفة داخل نينجا شفويًا، كتابيًا أو عبر العروض التقديمية.', 'يلاحظ ويفهم الإشارات اللفظية وغير اللفظية لاستخلاص فهم أعمق.'],
      },
      {
        level: 3,
        title: 'Advanced',
        titleAr: 'متقدم',
        description: 'The ability to choose and utilize adequate communication techniques.',
        descriptionAr: 'القدرة على اختيار واستخدام تقنيات الاتصال المناسبة وفقًا للجماهير المختلفة والمواضيع والمواقف، مع معالجة أي حلول محتملة وعدم ترك أي مجال للغموض؛ شفويًا وكتابيًا:',
        behaviors: ['Possesses flawless language and elocution skills.', 'Tailors communication techniques for different audiences.', 'Possesses confidence to speak in public.', 'Responsive to subtle cues and elicits information from others.'],
        behaviorsAr: ['يمتلك مهارات لغوية وفصاحة خالية من العيوب، ولا يترك مجالاً للأخطاء أو الغموض عند التواصل شفويًا، كتابيًا، أو عبر العروض التقديمية.', 'يكيف تقنيات الاتصال وفقًا للجماهير المختلفة والمواضيع والمواقف.', 'يمتلك الثقة في التحدث أمام الجمهور ويستحوذ على اهتمامه.', 'يكون متجاوبًا مع الإشارات الدقيقة ويستخلص المعلومات من الآخرين بما يتجاوز ما يُفصح عنه، من خلال تفسير لغة الجسد، ونبرة الصوت، وردود الفعل، وغيرها.'],
      },
      {
        level: 4,
        title: 'Expert',
        titleAr: 'خبير',
        description: 'The ability to speak naturally, eloquently and make complex ideas clear.',
        descriptionAr: 'القدرة على التحدث بشكل طبيعي، بليغ ومهذب، وجعل الأفكار والمواقف المعقدة واضحة ومفهومة للآخرين:',
        behaviors: ['Speaks with high confidence and handles difficult questions.', 'Drives effective communication across the organization.', 'Explains complex ideas in an understandable way.', 'Easy to talk to and establishes rapport with others.'],
        behaviorsAr: ['يتحدث بثقة عالية ويتعامل مع الأسئلة والمواقف الصعبة بسرعة وحدس.', 'يحقق تواصلاً فعالاً عبر نينجا من خلال تحديد أفضل تقنيات الاتصال ويخلق فرصًا لتعزيز التواصل الفعّال، شفويًا، كتابيًا أو عبر العروض التقديمية.', 'يمتلك القدرة على شرح وتقديم الأفكار والقضايا المعقدة بطريقة مفهومة للآخرين.', 'يسهل التحدث معه ويجعل الآخرين ينفتحون، ويقيم علاقة تواصل جيدة مع المتحدث ويستخلص القصة كاملة.'],
      },
    ],
  },
  {
    id: 'customer-focus',
    name: 'Customer Focus',
    nameAr: 'التركيز على العملاء',
    type: 'core',
    definition: 'The willingness and capacity to understand internal and external customers\' needs, taking initiatives and providing service excellence.',
    definitionAr: 'الاستعداد والقدرة على فهم احتياجات العملاء الداخليين والخارجيين، مع اتخاذ المبادرات وتقديم خدمة متميزة تتجاوز المطلوب وتتجاوز توقعات العملاء.',
    proficiencyLevels: [
      {
        level: 1,
        title: 'Basic',
        titleAr: 'أساسي',
        description: 'The ability to understand customers\' needs and maintain clear communication.',
        descriptionAr: 'القدرة على فهم احتياجات العملاء ومخاوفهم والحفاظ على تواصل واضح معهم، بالإضافة إلى التعامل مع المواقف بشكل مناسب وحل المشكلات البسيطة بسرعة وفعالية:',
        behaviors: ['Identifies and understands customers\' needs.', 'Maintains clear communication with customers.', 'Follows up on customers\' requests within scope.', 'Ensures issues are addressed effectively.'],
        behaviorsAr: ['يحدد ويستوعب احتياجات العملاء ومخاوفهم.', 'يحافظ على تواصل واضح مع العملاء لإدارة توقعاتهم.', 'يتابع طلبات وشكاوى العملاء ضمن نطاق عمله.', 'يضمن معالجة جميع القضايا المتعلقة بشكل فعال.'],
      },
      {
        level: 2,
        title: 'Intermediate',
        titleAr: 'متوسط',
        description: 'The ability to take ownership of customers\' requests and resolve them effectively.',
        descriptionAr: 'القدرة على تحمل مسؤولية طلبات العملاء والتعامل معها وحلها بسرعة وفعالية:',
        behaviors: ['Sustains relations with customers.', 'Strives to satisfy customers\' needs promptly.', 'Takes personal responsibility for correcting issues.', 'Prevents issues from recurring.'],
        behaviorsAr: ['يحافظ على العلاقات مع العملاء الداخليين والخارجيين لضمان رضاهم المستمر.', 'يسعى لتلبية احتياجات العملاء ومعالجة مخاوفهم بسرعة.', 'يتحمل المسؤولية الشخصية لتصحيح مشكلات العملاء ضمن نطاق عمله.', 'يتابع حل شكاوى العملاء ويتخذ الإجراءات اللازمة لمنع تكرار هذه المشكلات.'],
      },
      {
        level: 3,
        title: 'Advanced',
        titleAr: 'متقدم',
        description: 'The ability to continuously meet and fulfill underlying customer needs.',
        descriptionAr: 'القدرة على تلبية توقعات العملاء باستمرار وفهم وتلبية احتياجاتهم ومتطلباتهم الأساسية:',
        behaviors: ['Seeks and analyzes underlying needs beyond initial requests.', 'Builds deep relationships with customers.', 'Identifies improvement areas for customer experience.', 'Promotes customer centricity culture.'],
        behaviorsAr: ['يسعى إلى جمع وتحليل المعلومات حول الاحتياجات والتوقعات الحقيقية للعملاء بما يتجاوز ما تم التعبير عنه في البداية.', 'يبني علاقات عميقة وطويلة المدى مع العملاء.', 'يحدد مجالات التحسين ضمن نطاق عمله لتعزيز تجربة العملاء.', 'يركز على ثقافة العميل في المركز ويعززها.'],
      },
      {
        level: 4,
        title: 'Expert',
        titleAr: 'خبير',
        description: 'The ability to demonstrate thorough understanding and seek long-term benefits.',
        descriptionAr: 'القدرة على إظهار فهم عميق لاحتياجات وتوقعات العملاء، والسعي المستمر لتحقيق منافع طويلة الأمد للعميل:',
        behaviors: ['Develops thorough understanding of specific needs.', 'Seeks long-term benefits and adjusts approaches.', 'Anticipates future requirements and coordinates actions.'],
        behaviorsAr: ['يطور فهمًا كاملاً وشاملاً لاحتياجات العملاء المحددة من خلال جمع وتوثيق المعلومات ذات الصلة.', 'يسعى لتحقيق منافع طويلة الأمد للعميل ويعدل الأساليب المتبعة وفقًا لذلك.', 'يتوقع متطلبات واحتياجات العملاء المستقبلية، ويتنسيق مع الوظائف ذات الصلة لاتخاذ الإجراءات اللازمة.'],
      },
    ],
  },
  {
    id: 'ownership',
    name: 'Ownership',
    nameAr: 'الملكية',
    type: 'core',
    definition: 'The ability to take full accountability of own tasks and responsibilities, exhibiting commitment at work.',
    definitionAr: 'القدرة على تحمل المسؤولية الكاملة عن المهام والواجبات الخاصة، وإظهار الالتزام في العمل تجاه الشركاء والمجتمع والشركة والأطراف المعنية.',
    proficiencyLevels: [
      {
        level: 1,
        title: 'Basic',
        titleAr: 'أساسي',
        description: 'The ability to take responsibility of own performance and actions.',
        descriptionAr: 'القدرة على تحمل مسؤولية الأداء والأفعال الشخصية:',
        behaviors: ['Takes on responsibility and recognizes consequences.', 'Admits mistakes without excuses.', 'Avoids blaming others and confronts problems directly.'],
        behaviorsAr: ['يتحمل المسؤولية ويدرك عواقب الأخطاء أو الفشل، ونتائج النجاح والإنجازات.', 'يعترف بالأخطاء ويصححها دون تقديم أعذار.', 'يتجنب لوم الآخرين على عدم تحقيق التوقعات ويواجه المشكلات بسرعة وبشكل مباشر.'],
      },
      {
        level: 2,
        title: 'Intermediate',
        titleAr: 'متوسط',
        description: 'The ability to accomplish tasks at high standards with commitment.',
        descriptionAr: 'القدرة على تحمل المسؤولية لإتمام المهام بمعايير عالية وإظهار الالتزام تجاه الفريق والشركة:',
        behaviors: ['Shows high interest in own responsibilities.', 'Takes proper procedures to achieve obligations.', 'Adheres to quality standards.'],
        behaviorsAr: ['يظهر اهتمامًا كبيرًا بالمسؤوليات المتعلقة بعمله ويلتزم بالتعلم المستمر وتطوير الذات لتحقيق هذه المسؤوليات.', 'يتبع جميع الإجراءات المناسبة لضمان الوفاء بالتزاماته ومسؤولياته.', 'يلتزم بالمعايير التي تضمن جودة العمل وتجنب الملاحظات السلبية، ويساهم في تحقيق الالتزام بمصالح الشركة.'],
      },
      {
        level: 3,
        title: 'Advanced',
        titleAr: 'متقدم',
        description: 'The ability to encourage colleagues to assume responsibility.',
        descriptionAr: 'القدرة على تحمل المسؤولية وتشجيع الزملاء على تحمل مسؤولياتهم وإنجاز مهامهم بأعلى جودة وكفاءة وأقل تكلفة لتحقيق مصالح الشركة مع الالتزام تجاه المجتمع المحيط:',
        behaviors: ['Sets accountability standards.', 'Ensures properly dealing with all mistakes.', 'Motivates the team to assume responsibility.', 'Puts company\'s interest ahead of personal.'],
        behaviorsAr: ['يضع معايير للمساءلة تضمن جودة عمل الشركة والتزاماتها تجاه المجتمع.', 'يضمن التعامل الصحيح مع جميع الأخطاء مهما كان نوعها.', 'يحفز الفريق على تحمل المسؤولية عند مواجهة تحديات ومضاعفات صعبة.', 'يضع مصلحة الشركة فوق المصالح الشخصية عند أداء مهامه.'],
      },
      {
        level: 4,
        title: 'Expert',
        titleAr: 'خبير',
        description: 'The ability to ensure rules and systems control responsibility.',
        descriptionAr: 'القدرة على تحمل المسؤولية عن جميع جوانب وظيفته بغض النظر عن حجمها أو تأثيرها، وضمان وجود قواعد وأنظمة تتحكم في تحمل المسؤولية داخل الشركة لتأكيد الالتزام تجاه المجتمع والشركاء وأصحاب المصلحة:',
        behaviors: ['Ensures accountability control standards.', 'Addresses all mistakes regardless of scale.', 'Ensures assigning roles for strategic goals.'],
        behaviorsAr: ['يضمن وجود معايير للتحكم في المساءلة داخل الشركة لخدمة مصالحها.', 'يتعامل مع جميع الأخطاء بشكل فعّال بغض النظر عن حجمها أو تأثيرها أو وقت اكتشافها.', 'يضمن توزيع الأدوار والمسؤوليات على الموظفين لضمان تحقيق أهداف الشركة الاستراتيجية.'],
      },
    ],
  },
  {
    id: 'teamwork',
    name: 'Teamwork',
    nameAr: 'العمل الجماعي',
    type: 'core',
    definition: 'The willingness to collaborate with colleagues and work collectively to achieve set objectives.',
    definitionAr: 'الاستعداد للتعاون مع الزملاء والعمل بشكل جماعي كجزء من الفريق من أجل تحقيق الأهداف المحددة بفعالية، بالإضافة إلى تعزيز ونشر ثقافة العمل، مع الالتزام بالمشاركة وقبول التنوع والاختلافات، وخلق بيئة عمل إيجابية داخل نينجا.',
    proficiencyLevels: [
      {
        level: 1,
        title: 'Basic',
        titleAr: 'أساسي',
        description: 'The ability to cooperate and seek advice from others when needed.',
        descriptionAr: 'القدرة على التعاون وطلب المشورة من الآخرين عند الحاجة:',
        behaviors: ['Recognizes own role in team goals.', 'Values diversity among team members.', 'Keeps team members informed on progress.', 'Recognizes work and team goals.'],
        behaviorsAr: ['يعي دوره والقيمة المضافة التي تساعد الفريق على تحقيق أهدافه.', 'يقدر التنوع بين أعضاء الفريق ويبرز صفاتهم الإيجابية.', 'يبقي أعضاء الفريق على اطلاع بالتقدم وأي مستجدات ضمن نطاق عمله ويشارك المعرفة ذات الصلة بشكل إيجابي.', 'يدرك أهداف العمل وأهداف الفريق.'],
      },
      {
        level: 2,
        title: 'Intermediate',
        titleAr: 'متوسط',
        description: 'The ability to support team\'s performance through recognition.',
        descriptionAr: 'القدرة على دعم وتعزيز أداء الفريق من خلال التعرف الصحيح على مهارات أعضاء الفريق:',
        behaviors: ['Praises team members\' accomplishments.', 'Seeks to accomplish team\'s goals.', 'Motivates team members about teamwork importance.', 'Monitors team performance.'],
        behaviorsAr: ['يثني على إنجازات وجهود أعضاء الفريق ويقدّم ملاحظات لتحسين الأداء.', 'يسعى دائمًا لتحقيق أهداف وغايات الفريق.', 'يحفّز أعضاء الفريق ويذكّرهم باستمرار بأهمية العمل الجماعي ووضع مصلحة الفريق قبل المصلحة الشخصية.', 'يراقب أداء فريقه ويتابع التقدم في تحقيق أهداف الفريق.'],
      },
      {
        level: 3,
        title: 'Advanced',
        titleAr: 'متقدم',
        description: 'The ability to create synergy among different teams.',
        descriptionAr: 'القدرة على خلق التكامل بين الفرق المختلفة وتعزيز سلوك التعاون بين أعضاء الفريق لتحقيق أفضل النتائج وإنجاز الأهداف المحددة:',
        behaviors: ['Promotes team spirit effectively.', 'Values ideas from all team members.', 'Anticipates teams\' needs.'],
        behaviorsAr: ['يعزز روح الفريق، ويقوم بالتدريب الفعّال للفريق، ويؤكد على الأدوار الفردية والجماعية.', 'يقدّر الأفكار والمساهمات من جميع أعضاء الفريق، ويثني على الاختلافات الثقافية، ويشجع على جلسات العصف الذهني لحل القضايا المختلفة.', 'يتوقع احتياجات ومتطلبات الفرق ويضمن تلبيتها بشكل مناسب.'],
      },
      {
        level: 4,
        title: 'Expert',
        titleAr: 'خبير',
        description: 'The ability to promote a "one team" culture with fairness and equality.',
        descriptionAr: 'القدرة على تعزيز ثقافة "فريق واحد" عبر نينجا، تدعم العدالة والمساواة والتكامل، والاستفادة من نقاط قوة جميع أعضاء الفريق لتحقيق الأهداف بغض النظر عن ثقافتهم أو خلفياتهم:',
        behaviors: ['Creates environment supporting cooperation.', 'Ensures integration of teams\' efforts.', 'Sets realistic objectives for multiple teams.'],
        behaviorsAr: ['يمتلك القدرة على خلق بيئة تدعم التعاون والتكامل وتعزز ممارسات العمل الجماعي عبر نينجا.', 'يضمن دمج جهود وأهداف الفرق المختلفة وتوافقها مع الأهداف الاستراتيجية لنينجا.', 'يضع أهدافًا واقعية وقابلة للتحقيق لفرق متعددة ويتابع تقدمها.'],
      },
    ],
  },
  // LEADERSHIP COMPETENCIES
  {
    id: 'decision-making',
    name: 'Decision Making',
    nameAr: 'اتخاذ القرار',
    type: 'leadership',
    definition: 'The ability to utilize all available information to produce sound and prompt decisions to achieve desired goals.',
    definitionAr: 'القدرة على الاستفادة من جميع المعلومات المتاحة المتعلقة بموقف محدد لاتخاذ قرارات سليمة وسريعة بشأنه، لتحديد أفضل الحلول و/أو المقايضات بين البدائل بما يساهم في تحقيق الأهداف المرجوة.',
    proficiencyLevels: [
      {
        level: 1,
        title: 'Basic',
        titleAr: 'أساسي',
        description: 'The ability to take day-to-day decisions under continuous supervision.',
        descriptionAr: 'القدرة على اتخاذ القرارات اليومية المتعلقة بالمهام الروتينية مع وجود إشراف مستمر:',
        behaviors: ['Follows explicit guidelines for routine decisions.', 'Seeks approval before making impactful decisions.'],
        behaviorsAr: ['يتبع الإرشادات والإجراءات الواضحة عند اتخاذ القرارات الروتينية.', 'يطلب الموافقة باستمرار قبل اتخاذ أي قرارات ذات تأثير.'],
      },
      {
        level: 2,
        title: 'Intermediate',
        titleAr: 'متوسط',
        description: 'The ability to take decisions with minimum uncertainty without supervision.',
        descriptionAr: 'القدرة على اتخاذ القرارات اليومية التي تنطوي على حد أدنى من عدم اليقين والمخاطر دون إشراف:',
        behaviors: ['Seeks information required for routine decisions.', 'Refers to others only when necessary.', 'Interprets guidelines regarding exceptions.', 'Makes complex decisions without set procedures.'],
        behaviorsAr: ['يسعى للحصول على المعلومات اللازمة لاتخاذ القرارات الروتينية.', 'يلجأ إلى الآخرين فقط عند الضرورة.', 'يفسر الإرشادات والإجراءات فيما يتعلق بالحالات الاستثنائية.', 'يمتلك القدرة على التفكير واتخاذ القرارات المعقدة التي لا توجد لها إجراءات محددة.'],
      },
      {
        level: 3,
        title: 'Advanced',
        titleAr: 'متقدم',
        description: 'The ability to bear responsibility for decisions to move things forward.',
        descriptionAr: 'القدرة على تحمل مسؤولية اتخاذ القرارات لدفع الأمور قدمًا والتصرف بسرعة لمعالجة الاحتياجات العاجلة:',
        behaviors: ['Assesses available information and contradictions.', 'Seeks guidance when the situation is unclear.', 'Assesses and weighs different factors.'],
        behaviorsAr: ['يقيم المعلومات المتاحة والتناقضات الكامنة للوصول إلى رؤية واضحة للخيارات الرئيسية وتحديد الأولويات.', 'يطلب الإرشاد عند الحاجة إذا كانت الحالة غير واضحة.', 'يقيم ويوازن العوامل المختلفة المؤثرة على الخيارات المتاحة.'],
      },
      {
        level: 4,
        title: 'Expert',
        titleAr: 'خبير',
        description: 'The ability to make strategic decisions with high risks.',
        descriptionAr: 'القدرة على اتخاذ قرارات استراتيجية ذات عواقب كبيرة وتنطوي على مخاطر عالية، باستخدام قيم سليمة وحس تجاري:',
        behaviors: ['Conceptualizes possible scenarios and outcomes.', 'Uses sound values and business sense.', 'Reaches decisions assuredly under public scrutiny.'],
        behaviorsAr: ['يستشرف السيناريوهات والنتائج المحتملة التي قد تنتج عن القرارات في بيئة متقلبة تتغير فيها العوامل بسرعة.', 'يستخدم قيمًا سليمة وحسًا تجاريًا لاتخاذ قرارات سريعة حتى في وجود ثغرات في المعلومات المتاحة.', 'يتخذ القرارات بثقة في بيئة تخضع للتدقيق العام.'],
      },
    ],
  },
  {
    id: 'empowering-others',
    name: 'Empowering Others',
    nameAr: 'تمكين الاخرين',
    type: 'leadership',
    definition: 'The ability to support others by developing their skills and capabilities, conveying confidence in their abilities.',
    definitionAr: 'القدرة على دعم الآخرين من خلال تطوير مهاراتهم وكفاءاتهم وقدراتهم ونقل المعرفة التي تؤثر في توجيه مستقبلهم؛ وإظهار الثقة في قدرات الموظفين لمساعدتهم على استثمار إمكانياتهم وتشجيعهم على النجاح؛ مع تمكين الموظفين من حرية اتخاذ القرارات بشأن كيفية إنجاز أهدافهم وحل المشكلات.',
    proficiencyLevels: [
      {
        level: 1,
        title: 'Basic',
        titleAr: 'أساسي',
        description: 'The ability to establish expectations and set clear tasks for employees.',
        descriptionAr: 'القدرة على تحديد التوقعات ووضع مهام وأهداف واضحة للموظفين، ومتابعة تقدم كل فرد في المهام الموكلة إليه، وتقديم الدعم المناسب عند الحاجة:',
        behaviors: ['Observes and recognizes gaps in skills.', 'Implements basic approaches to support others.', 'Evaluates work done and provides feedback.'],
        behaviorsAr: ['يلاحظ ويحدد الفجوات في مهارات الفرد وقدراته وصفاته.', 'يمتلك القدرة على تطبيق الأساليب والعمليات الأساسية لدعم الآخرين في تحسين كفاءاتهم أو اكتساب مهارات جديدة.', 'يقيم العمل المنجز ويقدّم ملاحظات بنّاءة.'],
      },
      {
        level: 2,
        title: 'Intermediate',
        titleAr: 'متوسط',
        description: 'The ability to communicate goals and delegate responsibilities effectively.',
        descriptionAr: 'القدرة على توصيل أهداف وغايات العمل للآخرين، وتفويض المسؤوليات بشكل فعال مع تقديم الدعم المناسب، من خلال مشاركة الملاحظات والمعرفة الشخصية، بالإضافة إلى تحفيز الآخرين وتسهيل تطوير الذات:',
        behaviors: ['Shares knowledge with subordinates actively.', 'Treats team members fairly.', 'Encourages self-reliance and development.', 'Balances tasks with capabilities.', 'Communicates objectives effectively.'],
        behaviorsAr: ['يشارك المعرفة والخبرة مع المرؤوسين بشكل فعال.', 'يعامل أعضاء الفريق بعدل، ويمنحهم فرصًا متساوية للنجاح.', 'يشجع الاعتماد على الذات وتطوير الذات بين المرؤوسين، ويزودهم بالأدوات والمعرفة اللازمة لأداء مهامهم بأقل قدر من المساعدة.', 'يوازن بين المهام والأهداف والغايات ومهارات وقدرات الأفراد.', 'يتواصل مع الأفراد بفعالية لمساعدتهم على فهم أهداف الشركة ودورهم ومساهمتهم في تحقيق هذه الأهداف.'],
      },
      {
        level: 3,
        title: 'Advanced',
        titleAr: 'متقدم',
        description: 'The ability to empower people and monitor their performance.',
        descriptionAr: 'القدرة على تمكين الأشخاص، ومراقبة أدائهم وتحسينه؛ مع التدخل وتوجيههم عند الحاجة لضمان تجاوزهم للتوقعات:',
        behaviors: ['Continuously mentors and improves competencies.', 'Identifies performance gaps and provides training.', 'Sets realistic goals with comprehensive instructions.'],
        behaviorsAr: ['يراقب الأفراد ويكرس الوقت والجهد بشكل مستمر لتوجيههم وتحسين كفاءاتهم ومهاراتهم ومعارفهم وقدراتهم.', 'يحدد الفجوات في أداء الأفراد، ويوفر التدريب والإرشاد اللازمين وفقًا لذلك، ويعزز القدرات والثقة بالنفس.', 'يضع ويكلف بأهداف ومهام واقعية، كما يقدم تعليمات شاملة تمكّن الأفراد من الأداء بفعالية.'],
      },
      {
        level: 4,
        title: 'Expert',
        titleAr: 'خبير',
        description: 'The ability to recognize and address gaps at organizational level.',
        descriptionAr: 'القدرة على التعرف على الفجوات في الأداء والمهارات ومعالجتها على مستوى المنظمة، وتكييف أساليب القيادة، مع ضمان مشاركة أعضاء الفريق في الشركة وانخراطهم في تحقيق الاستراتيجية العامة والنمو:',
        behaviors: ['Facilitates knowledge sharing across the company.', 'Facilitates leadership training.', 'Ensures effective cross-functional communication.', 'Stays informed with latest developments.'],
        behaviorsAr: ['يسهل بنشاط ويساهم في مشاركة المعرفة والخبرة الفنية عبر الشركة.', 'يسهل التدريب القيادي للأفراد عند الحاجة، ويقيّم باستمرار برامج التدريب ونتائجها.', 'يوجّه ويضمن التواصل الفعال بين الوظائف والفرق المختلفة من أجل تحقيق الأهداف المشتركة.', 'يواكب أحدث التطورات وأفضل الممارسات في المجال، ويسعى لغرسها داخل الشركة.'],
      },
    ],
  },
  {
    id: 'planning-organizing',
    name: 'Planning & Organizing',
    nameAr: 'التخطيط و التنظيم',
    type: 'leadership',
    definition: 'The ability to plan activities and tasks in advance, identifying priorities and resources.',
    definitionAr: 'القدرة على تخطيط جميع الأنشطة والمهام الموكلة للموظف أو للآخرين مسبقًا، وتحديد الأولويات والموارد، لضمان نجاح التنفيذ وبما يتماشى مع الأهداف المرتبطة بالأنشطة والمهام.',
    proficiencyLevels: [
      {
        level: 1,
        title: 'Basic',
        titleAr: 'أساسي',
        description: 'The ability to organize routine tasks and prioritize by importance.',
        descriptionAr: 'القدرة على تنظيم المهام الروتينية الموكلة للموظف وترتيب أولويات تنفيذها حسب الأهمية، وتنظيم الموارد المتاحة لإتمام المهام في الوقت المحدد:',
        behaviors: ['Keeps concerned persons informed of achievement.', 'Uses available resources responsibly.'],
        behaviorsAr: ['يبقي الأشخاص المعنيين على اطلاع ووعي بمستوى الإنجاز في المهام الموكلة.', 'يستخدم الموارد المتاحة بمسؤولية وكفاءة.'],
      },
      {
        level: 2,
        title: 'Intermediate',
        titleAr: 'متوسط',
        description: 'The ability to divide tasks to facilitate management.',
        descriptionAr: 'القدرة على تقسيم المهام لتسهيل عملية إدارتها وإتمامها على أكمل وجه:',
        behaviors: ['Develops supporting objectives aligned with department.', 'Thinks ahead and plans short-term.', 'Adapts to work pressure effectively.', 'Determines timetable and resources needed.'],
        behaviorsAr: ['يضع أهدافًا داعمة تتماشى مع الأهداف الرئيسية للقسم/الإدارة.', 'يفكر مسبقًا ويخطط للمراحل التالية من العمل على المدى القصير.', 'يمتلك القدرة على التكيف مع ضغط العمل من خلال التخطيط وتنظيم العمل بفعالية.', 'يمتلك القدرة على تحديد الجدول الزمني والموارد اللازمة لتحقيق الأهداف المطلوبة.'],
      },
      {
        level: 3,
        title: 'Advanced',
        titleAr: 'متقدم',
        description: 'The ability to set realistic goals and determine necessary resources.',
        descriptionAr: 'القدرة على وضع أهداف واقعية ومنطقية، وتحديد الموارد اللازمة لتحقيق هذه الأهداف، بما في ذلك الموظفين ورأس المال والتقنية والمرافق، من أجل خدمة الأولويات المحددة:',
        behaviors: ['Continuously evaluates progress per plan.', 'Anticipates obstacles and takes preventive actions.', 'Keeps others informed of plans and changes.', 'Maintains calm in unplanned situations.'],
        behaviorsAr: ['يقيم ويجري متابعة مستمرة لتقدم العمل وفقًا للخطة الموضوعة.', 'يتوقع العقبات المحتملة ويتخذ الإجراءات الوقائية والتصحيحية بما يتناسب مع الوضع الحالي.', 'يبقي الآخرين على اطلاع بالخطط والتغييرات والتعديلات والقرارات المتعلقة بها.', 'يحافظ على الهدوء عند مواجهة مواقف أو مطالب غير مخططة أو متضاربة.'],
      },
      {
        level: 4,
        title: 'Expert',
        titleAr: 'خبير',
        description: 'The ability to identify company priorities for long-term requirements.',
        descriptionAr: 'القدرة على تحديد أولويات الشركة لمواكبة الاحتياجات طويلة المدى، مع مراعاة التوازن بينها وبين الإمكانيات المتاحة:',
        behaviors: ['Predicts company\'s future needs.', 'Ensures coordination among all parties.', 'Ensures consistency between departmental plans.', 'Tracks general course of plans.'],
        behaviorsAr: ['يتنبأ باحتياجات الشركة المستقبلية مسبقًا.', 'يتعاون ويضمن التنسيق بين جميع الأطراف المعنية لتجنب التنافس بين المطالب وتكرار العمل، ويضمن توافق جميع الخطط مع الأهداف الاستراتيجية المحددة.', 'يضمن التناسق بين خطط الأقسام المختلفة لتقليل المواقف والمطالب غير المتوقعة أو المتضاربة.', 'يتابع المسار العام للخطط ويأخذ في الاعتبار التحولات الكبيرة والنكسات المحتملة.'],
      },
    ],
  },
  {
    id: 'social-intelligence',
    name: 'Social Intelligence',
    nameAr: 'الذكاء الاجتماعي',
    type: 'leadership',
    definition: 'The capacity to understand social situations and dynamics, and manage emotions effectively.',
    definitionAr: 'القدرة على فهم المواقف والديناميكيات الاجتماعية المختلفة، بالإضافة إلى القدرة على العمل بفعالية في مختلف المواقف الاجتماعية. وتشمل القدرة على التعرف على المشاعر الذاتية ومشاعر الآخرين، وإدارة العواطف بشكل فعال.',
    proficiencyLevels: [
      {
        level: 1,
        title: 'Basic',
        titleAr: 'أساسي',
        description: 'The ability to focus on how one\'s actions align with company standards.',
        descriptionAr: 'القدرة على التركيز على الذات وكيفية توافق أفعال الفرد وأفكاره أو عواطفه مع معايير الشركة:',
        behaviors: ['Understands own emotions and their effects.', 'Evaluates themselves objectively.', 'Manages own emotions.', 'Aligns behavior with company values.', 'Understands how others perceive them.'],
        behaviorsAr: ['يفهم عواطفه وتأثيرها على أدائه الشخصي.', 'يقيم نفسه بشكل موضوعي ومستمر.', 'يدير عواطفه بشكل فعال.', 'يوافق سلوكه مع قيم الشركة.', 'يفهم بشكل صحيح كيف يراه الآخرون.'],
      },
      {
        level: 2,
        title: 'Intermediate',
        titleAr: 'متوسط',
        description: 'The ability to regulate emotions and behaviors effectively.',
        descriptionAr: 'القدرة على تنظيم العواطف والأفكار والسلوكيات بشكل فعّال في مختلف المواقف؛ إدارة الذات:',
        behaviors: ['Exercises self control under stress.', 'Identifies strengths and weaknesses.', 'Embraces constructive criticism.'],
        behaviorsAr: ['يمارس ضبط النفس من خلال الحفاظ على هدوئه والاستمرار في أداء فعّال تحت الضغط.', 'يحدد نقاط القوة والضعف الخاصة به/بالفريق ويستفيد منها لتحقيق الأهداف المتعلقة بنطاق العمل.', 'يتقبل النقد البنّاء كفرصة للنمو والتطوير الذاتي.'],
      },
      {
        level: 3,
        title: 'Advanced',
        titleAr: 'متقدم',
        description: 'The ability to empathize with others from diverse backgrounds.',
        descriptionAr: 'القدرة على الوعي الاجتماعي، وأخذ منظور الآخرين والتعاطف معهم من خلفيات وثقافات متنوعة، وفهم الأعراف الاجتماعية والأخلاقية للسلوك:',
        behaviors: ['Is empathetic and gauges others\' feelings.', 'Senses others\' emotions and perspectives.', 'Reads groups\' emotional currents.'],
        behaviorsAr: ['متعاطف ويستشعر مشاعر الآخرين من خلال إظهار اهتمام فعّال بالقضايا التي يواجهونها، مع التقاط الإشارات حول ما يشعر به الآخرون ويفكرون فيه.', 'يستشعر عواطف الآخرين ويفهم وجهات نظرهم الفريدة، ويتعلم أخذ اهتمام نشط بالأمور التي تهمهم.', 'يقرأ التيارات العاطفية للمجموعات لتحديد المؤثرين وفهم ديناميكيات المنظمة.'],
      },
      {
        level: 4,
        title: 'Expert',
        titleAr: 'خبير',
        description: 'The ability to manage relationships wisely across all levels.',
        descriptionAr: 'القدرة على إدارة العلاقات داخل المنظمة، والتمتع بالذكاء الاجتماعي والتصرف بحكمة في مختلف العلاقات عبر جميع المستويات الإدارية؛ وكذلك القدرة على فهم مزاج وسلوك ودوافع الآخرين لتحسين جودة وصلابة العلاقات:',
        behaviors: ['Helps others through difficult situations.', 'Recognizes drives and motivates employees.', 'Validates employees\' feelings.', 'Reinforces culture of understanding.'],
        behaviorsAr: ['يساعد الآخرين في المواقف الصعبة من خلال تعزيز الحوار المفتوح وإيجاد الحلول عند الحاجة.', 'يتعرف على دوافع الأشخاص المختلفة في الشركة ويستفيد منها لتحفيز الموظفين على العمل نحو هدف مشترك.', 'يعترف بمشاعر الموظفين ويتعامل معها في مجموعة واسعة من المواقف.', 'يعزز ثقافة الفهم والاحترام المتبادل بين الأفراد لرفع مستوى رضا الموظفين في نينجا.'],
      },
    ],
  },
  {
    id: 'strategic-thinking',
    name: 'Strategic Thinking',
    nameAr: 'التفكير الاستراتيجي',
    type: 'leadership',
    definition: 'The ability to foresee scenarios with future implications and formulate effective long-term strategies.',
    definitionAr: 'القدرة على استشراف السيناريوهات المتعلقة بالأعمال ذات التداعيات المستقبلية من خلال التركيز على "الصورة الكبيرة"، وصياغة استراتيجيات وخطط عمل طويلة الأمد بفاعلية، مع الأخذ في الاعتبار تجارب نينجا السابقة والحالية.',
    proficiencyLevels: [
      {
        level: 1,
        title: 'Basic',
        titleAr: 'أساسي',
        description: 'The ability to demonstrate knowledge of strategy and set priorities.',
        descriptionAr: 'القدرة على إظهار المعرفة باستراتيجية الشركة وأهدافها، والقدرة على تحديد أولويات أنشطة العمل وفقًا لذلك:',
        behaviors: ['Possesses knowledge of key strategy elements.', 'Distinguishes essential and non-essential activities.', 'Recognizes impact of work plans.'],
        behaviorsAr: ['يمتلك المعرفة بالعناصر الأساسية لاستراتيجية نينجا.', 'يمتلك القدرة على التمييز بين الأنشطة الأساسية وغير الأساسية بما يتماشى مع أهداف نينجا.', 'يدرك تأثير خطط العمل على الأنشطة المختلفة ضمن نطاق عمله.'],
      },
      {
        level: 2,
        title: 'Intermediate',
        titleAr: 'متوسط',
        description: 'The ability to think ahead and recognize decision consequences.',
        descriptionAr: 'القدرة على التفكير مسبقًا والتعرف على عواقب قرارات الفرد على تحقيق استراتيجية الشركة، وفهم شامل لنقاط القوة والضعف في الشركة:',
        behaviors: ['Understands strategy and translates to operations.', 'Develops work plans aligned with strategy.'],
        behaviorsAr: ['يفهم استراتيجية نينجا ويحوّلها إلى أنشطة تشغيلية ومتطلبات فنية مرتبطة مباشرة بنطاق عمله.', 'يمتلك القدرة على وضع خطط العمل والأهداف المتعلقة بمهامه، وتنفيذها بما يتماشى مع استراتيجية نينجا.'],
      },
      {
        level: 3,
        title: 'Advanced',
        titleAr: 'متقدم',
        description: 'The ability to foresee future results affecting company vision.',
        descriptionAr: 'القدرة على استشراف النتائج والتداعيات المستقبلية التي قد تؤثر على تحقيق رؤية الشركة، من خلال فهم اتجاهات الصناعة والسوق المؤثرة على الشركة، وتحديد التهديدات والفرص المحتملة مع مراعاة قدرات وإمكانات الشركة:',
        behaviors: ['Assesses and links short-term with strategic objectives.', 'Plans effectively for medium and long-term.', 'Shows commitment to strategic objectives.'],
        behaviorsAr: ['يقيم ويربط الأهداف قصيرة المدى بأهداف نينجا الاستراتيجية.', 'يمتلك القدرة على التخطيط بفعالية للأهداف المتوسطة والطويلة المدى.', 'يظهر الالتزام بالأهداف الاستراتيجية حتى لو كان ذلك يؤثر على عمله الخاص و/أو عندما لا يوافق الآخرون على ذلك.'],
      },
      {
        level: 4,
        title: 'Expert',
        titleAr: 'خبير',
        description: 'The ability to continuously plan with company vision and manage threats.',
        descriptionAr: 'القدرة على التخطيط المستمر بما يتماشى مع الاتجاه العام ورؤية الشركة، وإدارة التهديدات والفرص، وتوقع مستقبل الصناعة وتغيرات اتجاهات السوق، وكذلك تصور تداعياتها على الشركة واستراتيجيتها:',
        behaviors: ['Maintains broad strategic perspective.', 'Predicts future and changes in industry.', 'Proposes strategy changes based on factors.'],
        behaviorsAr: ['يحافظ على منظور استراتيجي واسع عند التعامل مع التفاصيل الحاسمة والمؤثرة التي تؤثر على نينجا.', 'يمتلك القدرة على التنبؤ بمستقبل نينجا وتغير طبيعة واتجاهات صناعة اللياقة البدنية، وتصوّر التأثير المحتمل لذلك على استراتيجية وموارد نينجا.', 'يمتلك القدرة على اقتراح تغييرات في استراتيجية نينجا وفقًا للعوامل والمستجدات المحيطة.'],
      },
    ],
  },
];

const coreCompetencies = competenciesData.filter((c) => c.type === 'core');
const leadershipCompetencies = competenciesData.filter((c) => c.type === 'leadership');


// ==================== COMPONENTS ====================
const FrameworkCard: React.FC<{
  number: number;
  title: string;
  color: string;
  bgColor: string;
  borderColor: string;
  points: string[];
}> = ({ number, title, color, bgColor, borderColor, points }) => (
  <div className={`relative flex flex-col rounded-2xl border-2 ${borderColor} bg-white p-6 pt-10 shadow-sm transition-all hover:shadow-md`}>
    <div className={`absolute -top-5 left-1/2 -translate-x-1/2 flex h-10 w-10 items-center justify-center rounded-full ${bgColor} text-lg font-bold text-white shadow-lg`}>
      {number}
    </div>
    <h3 className={`mb-4 text-center text-lg font-bold ${color}`}>{title}</h3>
    <ul className="space-y-3 text-sm text-gray-600">
      {points.map((point, idx) => (
        <li key={idx} className="flex items-start gap-2">
          <span className={`mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full ${bgColor}`} />
          <span className="leading-relaxed">{point}</span>
        </li>
      ))}
    </ul>
    <div className={`absolute bottom-0 left-1/2 h-4 w-0.5 -translate-x-1/2 translate-y-full ${bgColor}`} />
  </div>
);

const FrameworkStructure: React.FC<{ language: Language }> = ({ language }) => {
  const t = uiLabels[language];
  const frameworkData = [
    {
      number: 1,
      title: t.coreCompetencies,
      color: 'text-blue-600',
      bgColor: 'bg-blue-500',
      borderColor: 'border-blue-200',
      points: t.corePoints,
    },
    {
      number: 2,
      title: t.leadershipCompetencies,
      color: 'text-teal-600',
      bgColor: 'bg-teal-500',
      borderColor: 'border-teal-200',
      points: t.leadershipPoints,
    },
    {
      number: 3,
      title: t.functionalCompetencies,
      color: 'text-green-600',
      bgColor: 'bg-green-500',
      borderColor: 'border-green-200',
      points: t.functionalPoints,
    },
  ];

  return (
    <div className="mb-8 rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">{t.competenciesStructure}</h2>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          {t.structureDescription}
        </p>
      </div>
      <div className="relative grid gap-8 pt-6 md:grid-cols-3">
        {frameworkData.map((item) => (
          <FrameworkCard key={item.number} {...item} />
        ))}
        <div className="absolute bottom-0 left-[16.67%] right-[16.67%] hidden h-0.5 translate-y-8 bg-gradient-to-r from-blue-400 via-teal-400 to-green-400 md:block" />
      </div>
    </div>
  );
};

const levelColors: Record<number, { bg: string; border: string; badge: string; text: string }> = {
  1: { bg: 'bg-slate-50', border: 'border-slate-200', badge: 'bg-slate-500', text: 'text-slate-700' },
  2: { bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-500', text: 'text-blue-700' },
  3: { bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-500', text: 'text-emerald-700' },
  4: { bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-500', text: 'text-amber-700' },
};

const ProficiencyLevelCard: React.FC<{ level: ProficiencyLevel; language: Language }> = ({ level, language }) => {
  const colors = levelColors[level.level] || levelColors[1];
  const isAr = language === 'ar';
  const t = uiLabels[language];

  return (
    <Card className={`${colors.bg} ${colors.border}`}>
      <CardContent className="p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Badge className={`${colors.badge} text-white`}>{t.level} {level.level}</Badge>
            <h4 className={`font-semibold ${colors.text}`}>{isAr ? (level.titleAr || level.title) : level.title}</h4>
          </div>
        </div>
        <p className="mb-3 text-sm text-gray-600 leading-relaxed">{isAr ? (level.descriptionAr || level.description) : level.description}</p>
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">{t.expectedBehaviors}</div>
          <ul className="space-y-2">
            {(isAr ? (level.behaviorsAr || level.behaviors) : level.behaviors).map((behavior, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                <span className={`mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full ${colors.badge}`} />
                <span className="leading-relaxed">{behavior}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

const CompetencyCard: React.FC<{ competency: Competency; defaultExpanded?: boolean; language: Language }> = ({ competency, defaultExpanded = false, language }) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const isCore = competency.type === 'core';
  const isAr = language === 'ar';
  const t = uiLabels[language];

  const typeConfig = isCore
    ? { label: t.coreCompetencyLabel, bgColor: 'bg-teal-50', borderColor: 'border-teal-200', textColor: 'text-teal-700', iconBg: 'bg-teal-100', icon: Sparkles }
    : { label: t.leadershipCompetencyLabel, bgColor: 'bg-indigo-50', borderColor: 'border-indigo-200', textColor: 'text-indigo-700', iconBg: 'bg-indigo-100', icon: Crown };

  const IconComponent = typeConfig.icon;
  const displayName = isAr ? (competency.nameAr || competency.name) : competency.name;
  const displayDefinition = isAr ? (competency.definitionAr || competency.definition) : competency.definition;

  return (
    <Card className={`border ${typeConfig.borderColor} bg-white shadow-sm transition-all duration-300 hover:shadow-md`}>
      <button onClick={() => setIsExpanded(!isExpanded)} className="w-full text-left focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2">
        <CardHeader className={`p-5 ${typeConfig.bgColor}`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${typeConfig.iconBg}`}>
                <IconComponent className={`h-6 w-6 ${typeConfig.textColor}`} />
              </div>
              <div>
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <CardTitle className="text-lg font-bold text-gray-900">{displayName}</CardTitle>
                  <Badge className={`${typeConfig.bgColor} ${typeConfig.textColor} border ${typeConfig.borderColor}`}>
                    {typeConfig.label}
                  </Badge>
                </div>
                {!isAr && competency.nameAr && (
                  <div className="text-sm text-gray-600">{competency.nameAr}</div>
                )}
                {isAr && (
                  <div className="text-sm text-gray-600">{competency.name}</div>
                )}
              </div>
            </div>
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 flex-shrink-0 text-gray-500" />
            ) : (
              <ChevronDown className="h-5 w-5 flex-shrink-0 text-gray-500" />
            )}
          </div>
        </CardHeader>
      </button>

      {isExpanded && (
        <>
          <CardContent className="border-t border-gray-100 px-5 py-4">
            <div className="mb-2 text-sm font-semibold uppercase tracking-wider text-gray-500">{t.definition}</div>
            <p className="text-sm leading-relaxed text-gray-700">{displayDefinition}</p>
          </CardContent>
          <CardContent className="border-t border-gray-100 px-5 pb-5 pt-4">
            <div className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">{t.proficiencyLevels}</div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {competency.proficiencyLevels.map((level) => (
                <ProficiencyLevelCard key={level.level} level={level} language={language} />
              ))}
            </div>
          </CardContent>
        </>
      )}
    </Card>
  );
};

// ==================== MAIN APP ====================
export default function CompetenciesDictionary() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<CompetencyType>('all');
  const expandAll = false;
  const [language, setLanguage] = useState<Language>('en');

  const isAr = language === 'ar';
  const t = uiLabels[language];

  const filteredCompetencies = useMemo(() => {
    let result = competenciesData;
    if (activeFilter === 'core') result = coreCompetencies;
    else if (activeFilter === 'leadership') result = leadershipCompetencies;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((competency) => {
        if (isAr) {
          return (
            (competency.nameAr || '').toLowerCase().includes(query) ||
            (competency.definitionAr || '').toLowerCase().includes(query) ||
            competency.name.toLowerCase().includes(query) ||
            competency.proficiencyLevels.some(
              (level) =>
                (level.descriptionAr || '').toLowerCase().includes(query) ||
                (level.behaviorsAr || []).some((b) => b.toLowerCase().includes(query))
            )
          );
        }
        return (
          competency.name.toLowerCase().includes(query) ||
          competency.definition.toLowerCase().includes(query) ||
          competency.proficiencyLevels.some(
            (level) => level.description.toLowerCase().includes(query) || level.behaviors.some((b) => b.toLowerCase().includes(query))
          )
        );
      });
    }
    return result;
  }, [searchQuery, activeFilter, isAr]);

  const filterButtons = [
    { key: 'all' as CompetencyType, label: t.allCompetencies },
    { key: 'core' as CompetencyType, label: t.core },
    { key: 'leadership' as CompetencyType, label: t.leadership },
  ];

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{t.title}</h2>
          <p className="text-gray-600">{t.subtitle}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
          className="font-semibold w-fit"
        >
          {language === 'en' ? 'العربية' : 'English'}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">{t.coreCompetencies}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="text-2xl font-bold text-gray-900">{coreCompetencies.length}</div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100">
              <Sparkles className="h-5 w-5 text-teal-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">{t.leadershipCompetencies}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="text-2xl font-bold text-gray-900">{leadershipCompetencies.length}</div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100">
              <Crown className="h-5 w-5 text-indigo-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">{t.total}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="text-2xl font-bold text-gray-900">{competenciesData.length}</div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
              <BookOpen className="h-5 w-5 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-md">
              <Search className={`absolute ${isAr ? 'right-3' : 'left-3'} top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400`} />
              <Input
                placeholder={t.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={isAr ? 'pr-9 pl-9' : 'pl-9 pr-9'}
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className={`absolute ${isAr ? 'left-2' : 'right-2'} top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600`}
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              {filterButtons.map((button) => (
                <Button
                  key={button.key}
                  size="sm"
                  variant={activeFilter === button.key ? 'default' : 'outline'}
                  onClick={() => setActiveFilter(button.key)}
                >
                  {button.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <FrameworkStructure language={language} />

      <div className="text-sm text-gray-500">{t.showing} {filteredCompetencies.length} {t.competencies}</div>

      {filteredCompetencies.length > 0 ? (
        <div className="space-y-6">
          {(activeFilter === 'all' || activeFilter === 'core') && (
            <div className="space-y-4">
              {activeFilter === 'all' && filteredCompetencies.some((c) => c.type === 'core') && (
                <div className="flex items-center gap-3">
                  <Badge className="bg-teal-100 text-teal-700">{t.coreCompetencies}</Badge>
                  <div className="h-px flex-1 bg-teal-100" />
                </div>
              )}
              <div className="grid gap-4">
                {filteredCompetencies.filter((c) => c.type === 'core').map((competency) => (
                  <CompetencyCard key={competency.id} competency={competency} defaultExpanded={expandAll} language={language} />
                ))}
              </div>
            </div>
          )}

          {(activeFilter === 'all' || activeFilter === 'leadership') && (
            <div className="space-y-4">
              {activeFilter === 'all' && filteredCompetencies.some((c) => c.type === 'leadership') && (
                <div className="flex items-center gap-3">
                  <Badge className="bg-indigo-100 text-indigo-700">{t.leadershipCompetencies}</Badge>
                  <div className="h-px flex-1 bg-indigo-100" />
                </div>
              )}
              <div className="grid gap-4">
                {filteredCompetencies.filter((c) => c.type === 'leadership').map((competency) => (
                  <CompetencyCard key={competency.id} competency={competency} defaultExpanded={expandAll} language={language} />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Search className="mx-auto h-10 w-10 text-gray-300" />
            <h3 className="mt-4 text-lg font-semibold text-gray-900">{t.noResults}</h3>
            <p className="mt-1 text-sm text-gray-500">{t.noResultsHint}</p>
            <Button
              className="mt-4"
              variant="outline"
              onClick={() => {
                setSearchQuery('');
                setActiveFilter('all');
              }}
            >
              {t.clearFilters}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
