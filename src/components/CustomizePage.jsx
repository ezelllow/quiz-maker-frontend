import Screen from './ui/Screen'
import SectionLabel from './ui/SectionLabel'
import AvatarCustomizer from './AvatarCustomizer'
import Icon from './ui/Icon'

/**
 * CustomizePage — the dedicated avatar customisation screen, reached from the
 * hanger icon on the Profile page. Hosts the AvatarCustomizer, which now both
 * equips owned gear AND lets you buy new gear (the old Shop) in one place.
 */
export default function CustomizePage({ user, onUserUpdate, authToken, gems, onGemsChange, onBack }) {
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
          <h1 className="!text-2xl !font-black tracking-tight inline-flex items-center gap-2">Customise your Ooka <Icon name="shirt" className="w-6 h-6 text-quiz-muted" /></h1>
        </div>
      </header>

      <AvatarCustomizer
        user={user}
        onUserUpdate={onUserUpdate}
        authToken={authToken}
        gems={gems}
        onGemsChange={onGemsChange}
      />
    </Screen>
  )
}
