export default function NewTicket() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-6 py-12 dark:bg-zinc-950">
      <div className="w-full max-w-lg">
        <div className="mb-8 flex flex-col gap-1">
          <a
            href="/tickets"
            className="mb-2 flex w-fit items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Retour aux tickets
          </a>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Nouveau ticket
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Décrivez votre problème et nous vous répondrons rapidement.
          </p>
        </div>

        <form className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="title"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Titre <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              placeholder="Résumez votre problème en une phrase"
              className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-600 dark:focus:border-zinc-600 dark:focus:ring-zinc-800"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="description"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              rows={5}
              placeholder="Décrivez votre problème en détail : étapes pour reproduire, comportement attendu, comportement observé…"
              className="resize-none rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-600 dark:focus:border-zinc-600 dark:focus:ring-zinc-800"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="priority"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Priorité <span className="text-red-500">*</span>
            </label>
            <select
              id="priority"
              defaultValue=""
              className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-600 dark:focus:ring-zinc-800"
            >
              <option value="" disabled>
                Sélectionnez une priorité
              </option>
              <option value="low">Faible</option>
              <option value="medium">Moyenne</option>
              <option value="high">Haute</option>
              <option value="critical">Critique</option>
            </select>
          </div>
    
          <div className="flex gap-3 pt-1">
            <a
              href="/tickets"
              className="flex h-10 flex-1 items-center justify-center rounded-lg border border-zinc-200 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-800"
            >
              Annuler
            </a>
            <button
              type="submit"
              className="flex h-10 flex-1 items-center justify-center rounded-lg bg-zinc-900 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Créer le ticket
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
