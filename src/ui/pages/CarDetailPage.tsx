import { useParams } from 'react-router-dom';

/** Detailseite auf `/car/:id` (Platzhalter, Inhalt folgt in T3.2). */
export function CarDetailPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <section>
      <h1>Auto-Details</h1>
      <p>Detailansicht für „{id}“ folgt in T3.2.</p>
    </section>
  );
}
