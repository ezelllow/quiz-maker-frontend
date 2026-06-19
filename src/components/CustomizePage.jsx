import Screen from './ui/Screen'
import SectionLabel from './ui/SectionLabel'
import AvatarCustomizer from './AvatarCustomizer'

/**
 * CustomizePage — the dedicated avatar customisation screen, reached from the
 * hanger icon on the Profile page. Hosts the AvatarCustomizer (skin tone +
 * equip owned gear). Buying new gear still happens in the Shop.
 */
export default function CustomizePage({ user, onUserUpdate, onBack }) {
  return (
    <Screen width="default">
      <header className="flex items-center gap-3 mb-4 pt-2">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to profile"
          className="shrink-0 w-9 h-9 rounded-full border border-quiz-border qq-card-solid
                     flex items-center justify-center text-quiz-text hover:-translate-y-0.5
                     active:scale-95 transition-all"
        >
          ←
        </button>
        <div className="min-w-0">
          <SectionLabel>Wardrobe</SectionLabel>
          <h1 className="!text-2xl !font-black tracking-tight">Customise your Ooka 🧥</h1>
        </div>
      </header>

      <AvatarCustomizer user={user} onUserUpdate={onUserUpdate} />
    </Screen>
  )
}
