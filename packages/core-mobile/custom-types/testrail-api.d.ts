declare module 'testrail-api' {
  interface TestRailConfig {
    host: string
    user: string // Note: this package uses 'user' not 'username'
    password: string
  }

  interface ITestRun {
    id: number
    name: string
    description?: string
    project_id: number
    suite_id?: number
    milestone_id?: number
    assignedto_id?: number
    include_all?: boolean
    case_ids?: number[]
    created_on?: number
  }

  interface INewTestRun {
    name: string
    description?: string
    suite_id?: number
    milestone_id?: number
    assignedto_id?: number
    include_all?: boolean
    case_ids?: number[]
  }

  interface IResult {
    status_id: number
    comment?: string
    defects?: string
    elapsed?: string
    version?: string
    assignedto_id?: number
  }

  interface ICase {
    id: number
    title: string
    section_id: number
    template_id: number
    type_id: number
    priority_id: number
    milestone_id?: number
    refs?: string
  }

  interface ICaseFilters {
    suite_id?: number
    section_id?: number
    created_after?: number
    created_before?: number
    created_by?: number[]
    milestone_id?: number[]
    priority_id?: number[]
    template_id?: number[]
    type_id?: number[]
    updated_after?: number
    updated_before?: number
    updated_by?: number[]
  }

  interface ISection {
    id: number
    name: string
    description?: string
    suite_id: number
    parent_id?: number
    display_order: number
    depth: number
  }

  interface INewSection {
    name: string
    description?: string
    suite_id: number
    parent_id?: number
  }

  interface ITest {
    id: number
    case_id: number
    status_id: number
    assignedto_id?: number
    run_id: number
    title: string
    template_id: number
    type_id: number
    priority_id: number
    estimate?: string
    estimate_forecast?: string
    refs?: string
    milestone_id?: number
    custom_expected?: string
    custom_preconds?: string
    custom_steps?: string
    custom_mission?: string
    custom_goals?: string
  }

  interface ApiResponse<T> {
    response: Response
    body: T
  }

  class TestRail {
    constructor(config: TestRailConfig)

    // Run methods
    addRun(
      projectId: number,
      content: Partial<INewTestRun>
    ): Promise<ApiResponse<ITestRun>>
    getRuns(projectId: number, filters?: any): Promise<ApiResponse<ITestRun[]>>
    getRun(runId: number): Promise<ApiResponse<ITestRun>>
    updateRun(
      runId: number,
      content: Partial<ITestRun>
    ): Promise<ApiResponse<ITestRun>>
    closeRun(runId: number): Promise<ApiResponse<ITestRun>>
    deleteRun(runId: number): Promise<void>

    // Result methods
    addResult(testId: number, content: IResult): Promise<any>
    addResults(
      runId: number,
      content: { results: Array<IResult & { test_id: number }> }
    ): Promise<any>
    addResultForCase(
      runId: number,
      caseId: number,
      content: IResult
    ): Promise<any>
    addResultsForCases(
      runId: number,
      content: { results: Array<IResult & { case_id: number }> }
    ): Promise<any>
    getResults(runId: number, filters?: any): Promise<any[]>
    getResultsForCase(
      runId: number,
      caseId: number,
      filters?: any
    ): Promise<any[]>
    getResultsForRun(runId: number, filters?: any): Promise<any[]>

    // Test methods
    getTest(testId: number): Promise<any>
    getTests(runId: number, filters?: any): Promise<ApiResponse<ITest[]>>

    // Case methods
    getCase(caseId: number): Promise<ApiResponse<ICase>>
    getCases(
      projectId: number,
      filters?: ICaseFilters
    ): Promise<ApiResponse<ICase[]>>
    addCase(
      sectionId: number,
      content: Partial<ICase>
    ): Promise<ApiResponse<ICase>>
    updateCase(
      caseId: number,
      content: Partial<ICase>
    ): Promise<ApiResponse<ICase>>
    deleteCase(caseId: number): Promise<void>

    // Project methods
    getProject(projectId: number): Promise<any>
    getProjects(filters?: any): Promise<any[]>

    // Section methods
    getSection(sectionId: number): Promise<ApiResponse<ISection>>
    getSections(
      projectId: number,
      filters?: any
    ): Promise<ApiResponse<ISection[]>>
    addSection(
      projectId: number,
      content: INewSection
    ): Promise<ApiResponse<ISection>>
    updateSection(
      sectionId: number,
      content: any
    ): Promise<ApiResponse<ISection>>
    deleteSection(sectionId: number): Promise<void>

    // Suite methods
    getSuite(suiteId: number): Promise<any>
    getSuites(projectId: number): Promise<any[]>

    // Other methods
    getStatuses(): Promise<any[]>
    getPriorities(): Promise<any[]>
    getUsers(): Promise<any[]>
    getUser(userId: number): Promise<any>
    getUserByEmail(email: string): Promise<any>
  }

  export = TestRail
}
