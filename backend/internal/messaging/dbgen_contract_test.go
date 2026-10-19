package messaging_test

import (
	"context"
	"database/sql"
	"testing"

	"github.com/DopestT/HALO-Go-Live-Be-Seen/backend/internal/messaging/dbgen"
)

func TestGeneratedMessengerQueryContract(t *testing.T) {
	q := dbgen.New((*sql.DB)(nil))
	ctx := context.Background()

	_ = q.FindDirectConversation
	_ = q.CreateDirectConversation
	_ = q.AddConversationParticipant
	_ = q.ListConversationParticipants
	_ = q.InsertMessage
	_ = q.ListConversationMessages
	_ = q.UpdateConversationRequestStatus
	_ = q.UpdateLastReadMessage
	_ = q.CountUnreadMessages
	_ = q.HideConversationForUser
	_ = q.UnhideConversationForUser
	_ = q.CreateUserBlock
	_ = q.DeleteUserBlock
	_ = q.CheckUserBlock
	_ = q.InsertModerationReport

	_ = ctx
}
