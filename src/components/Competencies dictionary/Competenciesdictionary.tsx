import React, { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { BookOpen, ChevronDown, ChevronUp, Crown, Search, Sparkles, X } from 'lucide-react';

// ==================== TYPES ====================
interface ProficiencyLevel {
  level: number;
  title: string;
  description: string;
  behaviors: string[];
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

// ==================== DATA ====================
const competenciesData: Competency[] = [
  // CORE COMPETENCIES
  {
    id: 'problem-solving',
    name: 'Problem Solving',
    nameAr: 'حل المشكلات',
    type: 'core',
    definition: 'The ability to identify problems, analyze root causes, generate effective solutions, and make sound decisions in a timely and systematic manner to achieve optimal outcomes.',
    definitionAr: 'القدرة على تحديد المشكلات وتحليل أسبابها الجذرية وتوليد حلول فعالة واتخاذ قرارات سليمة.',
    proficiencyLevels: [
      { level: 1, title: 'Basic', description: 'The ability to identify simple problems and seek guidance to resolve them.', behaviors: ['Recognizes problems and reports them promptly.', 'Collects basic information related to the issue.', 'Follows established procedures to address problems.', 'Seeks support when facing unfamiliar situations.'] },
      { level: 2, title: 'Intermediate', description: 'The ability to analyze problems and propose appropriate solutions independently.', behaviors: ['Analyzes problems by breaking them into manageable components.', 'Identifies root causes using logical thinking.', 'Suggests practical and effective solutions.', 'Evaluates potential risks before implementing solutions.'] },
      { level: 3, title: 'Advanced', description: 'The ability to handle complex problems and guide others in problem-solving.', behaviors: ['Anticipates potential problems and takes preventive actions.', 'Applies structured problem-solving techniques and best practices.', 'Supports and guides colleagues in resolving challenges.', 'Balances multiple factors (cost, quality, time) when deciding on solutions.'] },
      { level: 4, title: 'Expert', description: 'The ability to solve strategic and high-impact problems and drive organizational improvement.', behaviors: ['Addresses complex, cross-functional, and strategic problems.', 'Develops innovative and long-term solutions aligned with organizational goals.', 'Ensures decisions are data-driven and consider broader organizational impact.', 'Builds a problem-solving culture by empowering teams.'] },
    ],
  },
  {
    id: 'communication',
    name: 'Communication',
    nameAr: 'التواصل',
    type: 'core',
    definition: 'The ability and skill of effectively interacting and exchanging information with others through expressing oneself clearly and concisely.',
    definitionAr: 'القدرة والمهارة في التفاعل الفعال وتبادل المعلومات مع الآخرين.',
    proficiencyLevels: [
      { level: 1, title: 'Basic', description: 'The ability to listen carefully and objectively, and exchange information adequately.', behaviors: ['Promptly provides factual and concise information.', 'Delivers verbal and written messages effectively.', 'Understands comments and feedback from others correctly.'] },
      { level: 2, title: 'Intermediate', description: 'The ability to convey and receive information effectively with different levels.', behaviors: ['Ensures effective communication by considering different factors.', 'Possesses the ability to detect underlying meanings.', 'Communicates effectively with different levels.', 'Realizes and understands verbal and non-verbal cues.'] },
      { level: 3, title: 'Advanced', description: 'The ability to choose and utilize adequate communication techniques.', behaviors: ['Possesses flawless language and elocution skills.', 'Tailors communication techniques for different audiences.', 'Possesses confidence to speak in public.', 'Responsive to subtle cues and elicits information from others.'] },
      { level: 4, title: 'Expert', description: 'The ability to speak naturally, eloquently and make complex ideas clear.', behaviors: ['Speaks with high confidence and handles difficult questions.', 'Drives effective communication across the organization.', 'Explains complex ideas in an understandable way.', 'Easy to talk to and establishes rapport with others.'] },
    ],
  },
  {
    id: 'customer-focus',
    name: 'Customer Focus',
    nameAr: 'التركيز على العملاء',
    type: 'core',
    definition: 'The willingness and capacity to understand internal and external customers\' needs, taking initiatives and providing service excellence.',
    definitionAr: 'الاستعداد والقدرة على فهم احتياجات العملاء وتقديم التميز في الخدمة.',
    proficiencyLevels: [
      { level: 1, title: 'Basic', description: 'The ability to understand customers\' needs and maintain clear communication.', behaviors: ['Identifies and understands customers\' needs.', 'Maintains clear communication with customers.', 'Follows up on customers\' requests within scope.', 'Ensures issues are addressed effectively.'] },
      { level: 2, title: 'Intermediate', description: 'The ability to take ownership of customers\' requests and resolve them effectively.', behaviors: ['Sustains relations with customers.', 'Strives to satisfy customers\' needs promptly.', 'Takes personal responsibility for correcting issues.', 'Prevents issues from recurring.'] },
      { level: 3, title: 'Advanced', description: 'The ability to continuously meet and fulfill underlying customer needs.', behaviors: ['Seeks and analyzes underlying needs beyond initial requests.', 'Builds deep relationships with customers.', 'Identifies improvement areas for customer experience.', 'Promotes customer centricity culture.'] },
      { level: 4, title: 'Expert', description: 'The ability to demonstrate thorough understanding and seek long-term benefits.', behaviors: ['Develops thorough understanding of specific needs.', 'Seeks long-term benefits and adjusts approaches.', 'Anticipates future requirements and coordinates actions.'] },
    ],
  },
  {
    id: 'ownership',
    name: 'Ownership',
    nameAr: 'تحمل المسؤولية',
    type: 'core',
    definition: 'The ability to take full accountability of own tasks and responsibilities, exhibiting commitment at work.',
    definitionAr: 'القدرة على تحمل المسؤولية الكاملة عن المهام والمسؤوليات.',
    proficiencyLevels: [
      { level: 1, title: 'Basic', description: 'The ability to take responsibility of own performance and actions.', behaviors: ['Takes on responsibility and recognizes consequences.', 'Admits mistakes without excuses.', 'Avoids blaming others and confronts problems directly.'] },
      { level: 2, title: 'Intermediate', description: 'The ability to accomplish tasks at high standards with commitment.', behaviors: ['Shows high interest in own responsibilities.', 'Takes proper procedures to achieve obligations.', 'Adheres to quality standards.'] },
      { level: 3, title: 'Advanced', description: 'The ability to encourage colleagues to assume responsibility.', behaviors: ['Sets accountability standards.', 'Ensures properly dealing with all mistakes.', 'Motivates the team to assume responsibility.', 'Puts company\'s interest ahead of personal.'] },
      { level: 4, title: 'Expert', description: 'The ability to ensure rules and systems control responsibility.', behaviors: ['Ensures accountability control standards.', 'Addresses all mistakes regardless of scale.', 'Ensures assigning roles for strategic goals.'] },
    ],
  },
  {
    id: 'teamwork',
    name: 'Teamwork',
    nameAr: 'العمل الجماعي',
    type: 'core',
    definition: 'The willingness to collaborate with colleagues and work collectively to achieve set objectives.',
    definitionAr: 'الاستعداد للتعاون مع الزملاء والعمل بشكل جماعي لتحقيق الأهداف.',
    proficiencyLevels: [
      { level: 1, title: 'Basic', description: 'The ability to cooperate and seek advice from others when needed.', behaviors: ['Recognizes own role in team goals.', 'Values diversity among team members.', 'Keeps team members informed on progress.', 'Recognizes work and team goals.'] },
      { level: 2, title: 'Intermediate', description: 'The ability to support team\'s performance through recognition.', behaviors: ['Praises team members\' accomplishments.', 'Seeks to accomplish team\'s goals.', 'Motivates team members about teamwork importance.', 'Monitors team performance.'] },
      { level: 3, title: 'Advanced', description: 'The ability to create synergy among different teams.', behaviors: ['Promotes team spirit effectively.', 'Values ideas from all team members.', 'Anticipates teams\' needs.'] },
      { level: 4, title: 'Expert', description: 'The ability to promote a "one team" culture with fairness and equality.', behaviors: ['Creates environment supporting cooperation.', 'Ensures integration of teams\' efforts.', 'Sets realistic objectives for multiple teams.'] },
    ],
  },
  // LEADERSHIP COMPETENCIES
  {
    id: 'decision-making',
    name: 'Decision Making',
    nameAr: 'اتخاذ القرارات',
    type: 'leadership',
    definition: 'The ability to utilize all available information to produce sound and prompt decisions to achieve desired goals.',
    definitionAr: 'القدرة على استخدام جميع المعلومات المتاحة لإنتاج قرارات سليمة وسريعة.',
    proficiencyLevels: [
      { level: 1, title: 'Basic', description: 'The ability to take day-to-day decisions under continuous supervision.', behaviors: ['Follows explicit guidelines for routine decisions.', 'Seeks approval before making impactful decisions.'] },
      { level: 2, title: 'Intermediate', description: 'The ability to take decisions with minimum uncertainty without supervision.', behaviors: ['Seeks information required for routine decisions.', 'Refers to others only when necessary.', 'Interprets guidelines regarding exceptions.', 'Makes complex decisions without set procedures.'] },
      { level: 3, title: 'Advanced', description: 'The ability to bear responsibility for decisions to move things forward.', behaviors: ['Assesses available information and contradictions.', 'Seeks guidance when the situation is unclear.', 'Assesses and weighs different factors.'] },
      { level: 4, title: 'Expert', description: 'The ability to make strategic decisions with high risks.', behaviors: ['Conceptualizes possible scenarios and outcomes.', 'Uses sound values and business sense.', 'Reaches decisions assuredly under public scrutiny.'] },
    ],
  },
  {
    id: 'empowering-others',
    name: 'Empowering Others',
    nameAr: 'تمكين الآخرين',
    type: 'leadership',
    definition: 'The ability to support others by developing their skills and capabilities, conveying confidence in their abilities.',
    definitionAr: 'القدرة على دعم الآخرين من خلال تطوير مهاراتهم وقدراتهم.',
    proficiencyLevels: [
      { level: 1, title: 'Basic', description: 'The ability to establish expectations and set clear tasks for employees.', behaviors: ['Observes and recognizes gaps in skills.', 'Implements basic approaches to support others.', 'Evaluates work done and provides feedback.'] },
      { level: 2, title: 'Intermediate', description: 'The ability to communicate goals and delegate responsibilities effectively.', behaviors: ['Shares knowledge with subordinates actively.', 'Treats team members fairly.', 'Encourages self-reliance and development.', 'Balances tasks with capabilities.', 'Communicates objectives effectively.'] },
      { level: 3, title: 'Advanced', description: 'The ability to empower people and monitor their performance.', behaviors: ['Continuously mentors and improves competencies.', 'Identifies performance gaps and provides training.', 'Sets realistic goals with comprehensive instructions.'] },
      { level: 4, title: 'Expert', description: 'The ability to recognize and address gaps at organizational level.', behaviors: ['Facilitates knowledge sharing across the company.', 'Facilitates leadership training.', 'Ensures effective cross-functional communication.', 'Stays informed with latest developments.'] },
    ],
  },
  {
    id: 'planning-organizing',
    name: 'Planning & Organizing',
    nameAr: 'التخطيط والتنظيم',
    type: 'leadership',
    definition: 'The ability to plan activities and tasks in advance, identifying priorities and resources.',
    definitionAr: 'القدرة على تخطيط الأنشطة والمهام مسبقاً وتحديد الأولويات والموارد.',
    proficiencyLevels: [
      { level: 1, title: 'Basic', description: 'The ability to organize routine tasks and prioritize by importance.', behaviors: ['Keeps concerned persons informed of achievement.', 'Uses available resources responsibly.'] },
      { level: 2, title: 'Intermediate', description: 'The ability to divide tasks to facilitate management.', behaviors: ['Develops supporting objectives aligned with department.', 'Thinks ahead and plans short-term.', 'Adapts to work pressure effectively.', 'Determines timetable and resources needed.'] },
      { level: 3, title: 'Advanced', description: 'The ability to set realistic goals and determine necessary resources.', behaviors: ['Continuously evaluates progress per plan.', 'Anticipates obstacles and takes preventive actions.', 'Keeps others informed of plans and changes.', 'Maintains calm in unplanned situations.'] },
      { level: 4, title: 'Expert', description: 'The ability to identify company priorities for long-term requirements.', behaviors: ['Predicts company\'s future needs.', 'Ensures coordination among all parties.', 'Ensures consistency between departmental plans.', 'Tracks general course of plans.'] },
    ],
  },
  {
    id: 'social-intelligence',
    name: 'Social Intelligence',
    nameAr: 'الذكاء الاجتماعي',
    type: 'leadership',
    definition: 'The capacity to understand social situations and dynamics, and manage emotions effectively.',
    definitionAr: 'القدرة على فهم المواقف الاجتماعية وإدارة العواطف بفعالية.',
    proficiencyLevels: [
      { level: 1, title: 'Basic', description: 'The ability to focus on how one\'s actions align with company standards.', behaviors: ['Understands own emotions and their effects.', 'Evaluates themselves objectively.', 'Manages own emotions.', 'Aligns behavior with company values.', 'Understands how others perceive them.'] },
      { level: 2, title: 'Intermediate', description: 'The ability to regulate emotions and behaviors effectively.', behaviors: ['Exercises self control under stress.', 'Identifies strengths and weaknesses.', 'Embraces constructive criticism.'] },
      { level: 3, title: 'Advanced', description: 'The ability to empathize with others from diverse backgrounds.', behaviors: ['Is empathetic and gauges others\' feelings.', 'Senses others\' emotions and perspectives.', 'Reads groups\' emotional currents.'] },
      { level: 4, title: 'Expert', description: 'The ability to manage relationships wisely across all levels.', behaviors: ['Helps others through difficult situations.', 'Recognizes drives and motivates employees.', 'Validates employees\' feelings.', 'Reinforces culture of understanding.'] },
    ],
  },
  {
    id: 'strategic-thinking',
    name: 'Strategic Thinking',
    nameAr: 'التفكير الاستراتيجي',
    type: 'leadership',
    definition: 'The ability to foresee scenarios with future implications and formulate effective long-term strategies.',
    definitionAr: 'القدرة على استشراف السيناريوهات ذات الآثار المستقبلية وصياغة استراتيجيات فعالة.',
    proficiencyLevels: [
      { level: 1, title: 'Basic', description: 'The ability to demonstrate knowledge of strategy and set priorities.', behaviors: ['Possesses knowledge of key strategy elements.', 'Distinguishes essential and non-essential activities.', 'Recognizes impact of work plans.'] },
      { level: 2, title: 'Intermediate', description: 'The ability to think ahead and recognize decision consequences.', behaviors: ['Understands strategy and translates to operations.', 'Develops work plans aligned with strategy.'] },
      { level: 3, title: 'Advanced', description: 'The ability to foresee future results affecting company vision.', behaviors: ['Assesses and links short-term with strategic objectives.', 'Plans effectively for medium and long-term.', 'Shows commitment to strategic objectives.'] },
      { level: 4, title: 'Expert', description: 'The ability to continuously plan with company vision and manage threats.', behaviors: ['Maintains broad strategic perspective.', 'Predicts future and changes in industry.', 'Proposes strategy changes based on factors.'] },
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

const FrameworkStructure: React.FC = () => {
  const frameworkData = [
    {
      number: 1,
      title: 'Core Competencies',
      color: 'text-blue-600',
      bgColor: 'bg-blue-500',
      borderColor: 'border-blue-200',
      points: [
        "Directly related to Ninja's strategy, vision, values and culture.",
        'Required from all job holders within Ninja.',
      ],
    },
    {
      number: 2,
      title: 'Leadership Competencies',
      color: 'text-teal-600',
      bgColor: 'bg-teal-500',
      borderColor: 'border-teal-200',
      points: [
        'Directly related to the organizational structure and the managerial levels.',
        'Required from job holders whose jobs have a managerial aspect to their nature.',
      ],
    },
    {
      number: 3,
      title: 'Functional Competencies',
      color: 'text-green-600',
      bgColor: 'bg-green-500',
      borderColor: 'border-green-200',
      points: [
        'Related to the functional nature of the job.',
        'Required from job holders that share a common functional background.',
      ],
    },
  ];

  return (
    <div className="mb-8 rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Competencies Structure</h2>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          The Competency Structure includes the Competency types, proficiency levels and degree of detail for each competency. The figure below illustrates the different types of Competencies identified:
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

const ProficiencyLevelCard: React.FC<{ level: ProficiencyLevel }> = ({ level }) => {
  const colors = levelColors[level.level] || levelColors[1];

  return (
    <Card className={`${colors.bg} ${colors.border}`}>
      <CardContent className="p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Badge className={`${colors.badge} text-white`}>Level {level.level}</Badge>
            <h4 className={`font-semibold ${colors.text}`}>{level.title}</h4>
          </div>
        </div>
        <p className="mb-3 text-sm text-gray-600 leading-relaxed">{level.description}</p>
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">Expected Behaviors</div>
          <ul className="space-y-2">
            {level.behaviors.map((behavior, index) => (
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

const CompetencyCard: React.FC<{ competency: Competency; defaultExpanded?: boolean }> = ({ competency, defaultExpanded = false }) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const isCore = competency.type === 'core';

  const typeConfig = isCore
    ? { label: 'Core Competency', bgColor: 'bg-teal-50', borderColor: 'border-teal-200', textColor: 'text-teal-700', iconBg: 'bg-teal-100', icon: Sparkles }
    : { label: 'Leadership Competency', bgColor: 'bg-indigo-50', borderColor: 'border-indigo-200', textColor: 'text-indigo-700', iconBg: 'bg-indigo-100', icon: Crown };

  const IconComponent = typeConfig.icon;

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
                  <CardTitle className="text-lg font-bold text-gray-900">{competency.name}</CardTitle>
                  <Badge className={`${typeConfig.bgColor} ${typeConfig.textColor} border ${typeConfig.borderColor}`}>
                    {typeConfig.label}
                  </Badge>
                </div>
                {competency.nameAr && (
                  <div className="text-sm text-gray-600">{competency.nameAr}</div>
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

      <CardContent className="border-t border-gray-100 px-5 py-4">
        <div className="mb-2 text-sm font-semibold uppercase tracking-wider text-gray-500">Definition</div>
        <p className="text-sm leading-relaxed text-gray-700">{competency.definition}</p>
        {competency.definitionAr && (
          <p className="mt-2 text-sm leading-relaxed text-gray-500">{competency.definitionAr}</p>
        )}
      </CardContent>

      {isExpanded && (
        <CardContent className="border-t border-gray-100 px-5 pb-5 pt-4">
          <div className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">Proficiency Levels</div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {competency.proficiencyLevels.map((level) => (
              <ProficiencyLevelCard key={level.level} level={level} />
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

// ==================== MAIN APP ====================
export default function CompetenciesDictionary() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<CompetencyType>('all');
  const [expandAll, setExpandAll] = useState(true);

  const filteredCompetencies = useMemo(() => {
    let result = competenciesData;
    if (activeFilter === 'core') result = coreCompetencies;
    else if (activeFilter === 'leadership') result = leadershipCompetencies;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((competency) =>
        competency.name.toLowerCase().includes(query) ||
        competency.definition.toLowerCase().includes(query) ||
        competency.proficiencyLevels.some(
          (level) => level.description.toLowerCase().includes(query) || level.behaviors.some((b) => b.toLowerCase().includes(query))
        )
      );
    }
    return result;
  }, [searchQuery, activeFilter]);

  const filterButtons = [
    { key: 'all' as CompetencyType, label: 'All Competencies' },
    { key: 'core' as CompetencyType, label: 'Core' },
    { key: 'leadership' as CompetencyType, label: 'Leadership' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Competencies Dictionary</h2>
          <p className="text-gray-600">Reference guide for core and leadership competencies.</p>
        </div>
        <div className="hidden" />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Core Competencies</CardTitle>
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
            <CardTitle className="text-sm font-medium text-gray-600">Leadership Competencies</CardTitle>
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
            <CardTitle className="text-sm font-medium text-gray-600">Total</CardTitle>
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
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search competencies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-9"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
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

      <FrameworkStructure />

      <div className="text-sm text-gray-500">Showing {filteredCompetencies.length} competencies</div>

      {filteredCompetencies.length > 0 ? (
        <div className="space-y-6">
          {(activeFilter === 'all' || activeFilter === 'core') && (
            <div className="space-y-4">
              {activeFilter === 'all' && filteredCompetencies.some((c) => c.type === 'core') && (
                <div className="flex items-center gap-3">
                  <Badge className="bg-teal-100 text-teal-700">Core Competencies</Badge>
                  <div className="h-px flex-1 bg-teal-100" />
                </div>
              )}
              <div className="grid gap-4">
                {filteredCompetencies.filter((c) => c.type === 'core').map((competency) => (
                  <CompetencyCard key={competency.id} competency={competency} defaultExpanded={expandAll} />
                ))}
              </div>
            </div>
          )}

          {(activeFilter === 'all' || activeFilter === 'leadership') && (
            <div className="space-y-4">
              {activeFilter === 'all' && filteredCompetencies.some((c) => c.type === 'leadership') && (
                <div className="flex items-center gap-3">
                  <Badge className="bg-indigo-100 text-indigo-700">Leadership Competencies</Badge>
                  <div className="h-px flex-1 bg-indigo-100" />
                </div>
              )}
              <div className="grid gap-4">
                {filteredCompetencies.filter((c) => c.type === 'leadership').map((competency) => (
                  <CompetencyCard key={competency.id} competency={competency} defaultExpanded={expandAll} />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Search className="mx-auto h-10 w-10 text-gray-300" />
            <h3 className="mt-4 text-lg font-semibold text-gray-900">No results found</h3>
            <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter.</p>
            <Button
              className="mt-4"
              variant="outline"
              onClick={() => {
                setSearchQuery('');
                setActiveFilter('all');
              }}
            >
              Clear filters
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
