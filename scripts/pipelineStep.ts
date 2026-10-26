// T11.3: Template-Hook (Vorlesung 02, S. 14). Fester Ablauf: execute, Fehler fangen,
// loggen, bei Fehler den letzten Datenstand behalten. Alle Pipeline-Schritte erben davon.
export abstract class PipelineStep {
  abstract readonly name: string;
  protected abstract execute(): Promise<void>; // hook

  async run(): Promise<boolean> {
    // template
    const start = Date.now();
    try {
      await this.execute();
      console.log(`${this.name} ok (${Date.now() - start} ms)`); // eslint-disable-line no-console
      return true;
    } catch (error) {
      console.error(`${this.name} failed, keeping last data`, error);
      return false;
    }
  }
}
