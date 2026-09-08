import Foundation
import Combine

// Placeholder for Pro tier logic.
// Wire this to StoreKit 2 when you’re ready to sell subscriptions or an IAP.

final class ProAccess: ObservableObject {
    static let shared = ProAccess()

    @Published private(set) var isProUnlocked: Bool = true // Client Q&A #3: Yes (assume Pro enabled for now)

    func refresh() async {
        // TODO: Implement StoreKit entitlement check and set isProUnlocked accordingly.
    }
}

