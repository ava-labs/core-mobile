declare module 'testrail-api' {
  interface TestRailConfig {
    host: string
    user: string
    password: string
  }

  class TestRail {
    constructor(config: TestRailConfig)
    
    // All methods return any to avoid type conflicts
    addRun(projectId: number, content: any): Promise<any>
    getRuns(projectId: number, filters?: any): Promise<any>
    getRun(runId: number): Promise<any>
    updateRun(runId: number, content: any): Promise<any>
    closeRun(runId: number): Promise<any>
    deleteRun(runId: number): Promise<void>

    addResult(testId: number, content: any): Promise<any>
    addResults(runId: number, content: any): Promise<any>
    addResultForCase(runId: number, caseId: number, content: any): Promise<any>
    addResultsForCases(runId: number, content: any): Promise<any>
    getResults(runId: number, filters?: any): Promise<any>
    getResultsForCase(runId: number, caseId: number, filters?: any): Promise<any>
    getResultsForRun(runId: number, filters?: any): Promise<any>

    getTest(testId: number): Promise<any>
    getTests(runId: number, filters?: any): Promise<any>

    getCase(caseId: number): Promise<any>
    getCases(projectId: number, filters?: any): Promise<any>
    addCase(sectionId: number, content: any): Promise<any>
    updateCase(caseId: number, content: any): Promise<any>
    deleteCase(caseId: number): Promise<void>

    getProject(projectId: number): Promise<any>
    getProjects(filters?: any): Promise<any>

    getSection(sectionId: number): Promise<any>
    getSections(projectId: number, filters?: any): Promise<any>
    addSection(projectId: number, content: any): Promise<any>
    updateSection(sectionId: number, content: any): Promise<any>
    deleteSection(sectionId: number): Promise<void>

    getSuite(suiteId: number): Promise<any>
    getSuites(projectId: number): Promise<any>

    getStatuses(): Promise<any>
    getPriorities(): Promise<any>
    getUsers(): Promise<any>
    getUser(userId: number): Promise<any>
    getUserByEmail(email: string): Promise<any>
  }

  export = TestRail
}